// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { ERC721Enumerable, ERC721 } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { console } from "hardhat/console.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";

contract SkyNft is ERC721Enumerable {
    using Strings for uint32;
    using Strings for int16;

    // protocol structure: 0x|lat|lon|placelen|place|datetime|skyobjects, no delimiters
    // field lengths defined as constants
    uint16 private constant PROTO_LAT = 4;
    uint16 private constant PROTO_LON = 4;
    uint16 private constant PROTO_PLACELEN = 1;
    uint16 private constant PROTO_DATETIME = 4;
    uint16 private constant PROTO_SKYOBJECT_ID = 3;
    uint16 private constant PROTO_SKYOBJECT_X = 2;
    uint16 private constant PROTO_SKYOBJECT_Y = 2;

    uint16 private constant CANVAS_WIDTH = 2000;
    uint16 private constant CANVAS_HEIGHT = 2000;

    uint64 private constant GEO_PRECISION = 10000000; // 7 decimal places
    uint64 private constant DECIMAL_PLACES = 7;

    struct SkyMap {
        int64 latitude;
        int64 longitude;
        string place;
        uint32 datetime;
        SkyObject[] objects;
    }

    struct SkyObject {
        uint32 id;
        int16 x;
        int16 y;
    }

    uint256 private _tokenIdTracker;
    mapping(uint256 => SkyMap) private _skymapStore;

    // constellations outlines
    struct Constellation {
        string name;
        uint24[] starIds;
    }
    Constellation[] public constellations;

    error ErrorInvalidData();

    constructor() ERC721("OnChainSkyMap", "OSKY") {}

    function addConstellationBatch(string[] calldata names, uint24[][] calldata starIdsBatch) public {
        require(names.length == starIdsBatch.length, "Names and starIdsBatch length must match");

        for (uint i = 0; i < names.length; i++) {
            constellations.push(Constellation(names[i], starIdsBatch[i]));
        }
    }

    function getConstellation(uint index) public view returns (string memory name, uint24[] memory starIds) {
        require(index < constellations.length, "Index out of bounds");
        Constellation storage constellation = constellations[index];
        return (constellation.name, constellation.starIds);
    }

    function decodeSkyMap(bytes calldata rawData) public pure returns (SkyMap memory) {
        /*if (!_isValidSkyMapSize(rawData)) {
            revert ErrorInvalidData();
        }*/

        SkyMap memory skyMap;
        uint16 offset = 0;

        // coordinates
        // TODO: validate lat/lon limits
        skyMap.latitude =
            int64(uint64(uint32(bytes4(rawData[offset:offset += PROTO_LAT])))) -
            90 *
            int64(GEO_PRECISION);
        skyMap.longitude =
            int64(uint64(uint32(bytes4(rawData[offset:offset += PROTO_LON])))) -
            180 *
            int64(GEO_PRECISION);

        // place
        uint16 placeLength = uint16(uint8(bytes1(rawData[offset:offset += PROTO_PLACELEN])));
        skyMap.place = string(bytes(rawData[offset:offset += placeLength]));

        // datetime
        skyMap.datetime = uint32(bytes4(rawData[offset:offset += PROTO_DATETIME]));

        // Determine the number of sky objects
        uint remainingBytes = rawData.length - offset;
        uint numPairs = remainingBytes / (PROTO_SKYOBJECT_ID + PROTO_SKYOBJECT_X + PROTO_SKYOBJECT_Y);

        skyMap.objects = new SkyObject[](numPairs);

        // init array and decode sky objects
        for (uint i = 0; i < numPairs; i++) {
            SkyObject memory pair;
            pair.id = uint24(bytes3(rawData[offset:offset += PROTO_SKYOBJECT_ID]));
            pair.x = _decodeSigned16(uint16(bytes2(rawData[offset:offset += PROTO_SKYOBJECT_X])));
            pair.y = _decodeSigned16(uint16(bytes2(rawData[offset:offset += PROTO_SKYOBJECT_Y])));
            skyMap.objects[i] = pair;
        }

        return skyMap;
    }

    function _decodeSigned16(uint16 encodedValue) private pure returns (int16) {
        // If the encoded value is greater than the max positive value for int16, it's a negative value
        if (encodedValue > 32767) {
            return int16(int24(uint24(encodedValue)) - 65536);
        } else {
            return int16(encodedValue);
        }
    }

    function datetimeString(uint32 datetime) public pure returns (string memory dtStr) {
        uint32 year = _extractBits(datetime, 20, 31); // 12 bits for year (20-31)
        uint32 month = _extractBits(datetime, 16, 19); // 4 bits for month (16-19)
        uint32 day = _extractBits(datetime, 11, 15); // 5 bits for day (11-15)
        uint32 hour = _extractBits(datetime, 6, 10); // 5 bits for hour (6-10)
        uint32 minute = _extractBits(datetime, 0, 5); // 6 bits for minute (0-5)

        bool isBC = year < 2000; // Year is in BC if it's greater than 4095
        string memory bcPrefix = "-00";
        if (isBC) {
            year = 2000 - year; // Adjust BC year
        } else {
            bcPrefix = "";
            year -= 2000; // Adjust AD year
        }

        string memory yearStr = _padStart(year.toString(), 4, "0");
        string memory monthStr = _padStart(month.toString(), 2, "0");
        string memory dayStr = _padStart(day.toString(), 2, "0");
        string memory hourStr = _padStart(hour.toString(), 2, "0");
        string memory minuteStr = _padStart(minute.toString(), 2, "0");

        return string.concat(bcPrefix, yearStr, "-", monthStr, "-", dayStr, " ", hourStr, ":", minuteStr);
    }

    function coordString(int64 value) public pure returns (string memory) {
        string memory numStr = Strings.toString(uint64(value >= 0 ? value : -value));
        string memory sign = value < 0 ? "-" : "";
        bytes1 decimalPoint = bytes1(uint8(46)); // ASCII code for '.'

        // Handle case where the number of digits is less than or equal to the decimal places
        if (bytes(numStr).length <= DECIMAL_PLACES) {
            return string(abi.encodePacked(sign, "0.", _padStart(numStr, uint8(DECIMAL_PLACES), "0")));
        }

        bytes memory strBytes = bytes(numStr);
        bytes memory formatted = new bytes(strBytes.length + 1); // +1 for the decimal point

        uint256 insertPoint = strBytes.length - uint256(DECIMAL_PLACES);
        for (uint32 i = 0; i < formatted.length; ++i) {
            formatted[i] = i == insertPoint ? decimalPoint : strBytes[i < insertPoint ? i : i - 1];
        }

        return string(abi.encodePacked(sign, formatted));
    }

    function _extractBits(uint32 value, uint8 startBit, uint8 endBit) private pure returns (uint32) {
        require(startBit < endBit, "Start bit must be less than end bit");
        require(endBit < 32, "End bit must be less than 32");

        // Shift right by the start bit
        uint32 shifted = value >> startBit;

        // Create a mask for the desired bits
        uint32 mask = uint32(1 << (endBit - startBit + 1)) - 1;

        // Apply the mask
        return shifted & mask;
    }

    function _padStart(string memory str, uint8 length, string memory padChar) public pure returns (string memory) {
        uint8 strLength = uint8(bytes(str).length);

        if (strLength >= length) {
            return str;
        }

        uint8 paddingNeeded = length - strLength;
        bytes memory padding = new bytes(paddingNeeded);
        bytes memory padCharBytes = bytes(padChar);

        require(padCharBytes.length == 1, "padChar must be a single character");

        for (uint32 i = 0; i < paddingNeeded; i++) {
            padding[i] = padCharBytes[0];
        }

        return string.concat(string(padding), str);
    }

    function _isValidSkyMapSize(bytes calldata rawData) private pure returns (bool) {
        uint256 size = PROTO_LAT + PROTO_LON + PROTO_PLACELEN + PROTO_DATETIME;
        size += uint256(uint8(bytes1(rawData[8:9]))); // length of place title
        uint256 skyObjectSize = PROTO_SKYOBJECT_ID + PROTO_SKYOBJECT_X + PROTO_SKYOBJECT_Y;

        // Minimum size check
        if (rawData.length < size) {
            return false;
        }

        // Check if the remaining size is a multiple of the pair size
        uint remainingSize = rawData.length - size;
        return remainingSize % skyObjectSize == 0;
    }

    function tokenURI() public view returns (/*uint256 tokenId*/ /*override*/ string memory uri) {
        bytes memory test = abi.encodePacked(
            hex"49ebdeb024566f9c2956656e7475726120436f756e74792c2043616c69666f726e69612c20556e6974656420537461746573fb7cf3f70002a500fbff620002ea02df00ab00042bff84feab000c6b02f4006000114b03350084001a1e036500630022b603a70087002df703e801cd0033c6043dfe980033d4041300030037f8043dffde0038120480feb20038f00481fee6003df70485ffab003f64045800570043ce04ccff9d0044280580fe65004627043b010000474605b5fe7b00484904750098004864054fff2b0048b6058efedd0058ff04a200f20059e7067bff8b005b9d05f4fff700602005bd00510062160440017c0063540716ffeb006ec8060100c2006edc068700a400703e07a900a00073d707b600d900756c0541012f00768707b101020078a307de0129007bc10824016b007df6076b015a007e6a086001ae0080fa06c701620082a90558016f00852807a701ca00878506f801af008a1607d40224008ade07740200008cce070f01ef008d3105d501a8008ff206c601f5009062070f021700936c072602450093c206f1022e009c1108e1081b009e4e07a40341009f8b06c3029900a0730601023900a2e8053201ff00a549078803a500a5a2079c03c700a628080d088500a72f078d03d100a73606d6030600a79f06f6032a00a7a107e308ae00a85f068302cf00a865076503b200a8e2076503be00ab25074e03cc00ac220710038d00ac5f05a9026500acd805e7028d00adb705ae027200ae9c060102af00af1007e2076600b1180730042100b27805ff02d300b324061102e900b3750752087400b536074b04ce00b5ad0722047e00b63b078a071400b68d04fb024100b6b8070f046d00b7050565028400b76805eb02f100bb24063b037100bcbf0513026e00bce40712054600bd12053d028e00bd47061c036800be8606de083b00bf1e071f06af00c1af063a03d800c1b905be032f00c1e90699049600c2050654040a00c2b106c5053400c40f06dc072300c49f05fb03a500c4c4057802ff00c597060a03cc00c671057a031100c77d06a0057f00c7e406b6065a00c8210591033f00c8ed065804b300cb12067b078f00cdf7065807a100cecf0651058500cfed0574037300d1ec063505a700d29604e502c800d32d04c002a100d50b0521032e00d59a061805e900d658058d040500d65f05a2043600d7f205f2058300d98705d9055700d99905e605aa00db930479027900dc1705dd066c00dca005b507e200dcf10585089500dd3905b4055100dfc305ad05ba00e024057304a800e03704dd033300e1200554045b00e25005a1068b00e29104b7030700e34c058a05af00e73c0562079200e73f056f061000e7b4056805f600e97e048f02f800e99b055305ba00eae1052e050400ed4604dc03f700ed97052d078300ee25052b05b200eef6052405af00ef610449029100ef8504ac038900efaf0524060400f1ec050b076b00f1f504f8051500f5ec0464031300f67204cf04ea00f695048e03ae00f87804b504a500faa604c5060500faf1049a046b00fb8a0486041000fdc204ab060700fe5504a906b000ff620441032700ffc204940584010190048c06d40102c90475051b010461046d07aa0106e5042a035e01078304460485010788045b06f4010790045a06ff0109570439046f0109a204490746010aba04420720010ba80433050b010c5e042d0823010c94040502d8010d45042e06ab010f33041b0580011029040d046b011045041205550113b003fa072801158d03eb04090115a303ea03c30116b803e206f901177003dc076501180303da082b01187303d7049c0118b403d1074601191503d005520119a903d10425011a1c03c90509011b9f03dc027b011bae03bb05bc011e3903a60708011e7603a406f9011f5303b803af011ff20397062201229b038507920123aa039b03eb012421037a057501255903c4028f012585036906e50125a9036706aa0126c203ab03070127af0380040d01295f037903f80129eb036f04210129f4035e04b2012a09034506ed012a2d034805ab012b08033d0701012c98035f0422012cff03c20252012d0e034404d5012db1034a0482012e8a03480469012ec803510422012ecc032d0533012f36033204e6012f4203190687012fc00368039101301d031705bd0130f80334047c01314f034304180131b903050629013230030106c8013241030305ff01329d034003fc0132bf037f030001332f02ff076a0133e402f705de01347a02ed06b101369502ed07c80137ce03a9025f01380a02e305380138780346036401388002d4077d01392a030204520139cb037002de013ac602bd0754013b7b02b1062a013bb002f60439013ce60325037f013d72029e063f013de102ab0570013f1d02f903d9013fa9030c03980140a003ba021f0141bb029d08290141dc02740690014252027006c60142ef026c0707014438029c049a014489027b07f201450702d303d20147b7035702a401482c0248059f0148af0239071901499b02a203fe01499c02ce0394014a7e02cb038e014b90022f0579014c7802c0038a014d0a023107f7014d1302340808014ea602fb0305014ebd028703e6014edf023b0863014efb01ff05ff014f20020b0791014f3e03ce01f1014f45030802ec014fa701f306bb015010024c04610150d401ed071b0150f701f9059001518e02d0033201522501f3056f01528e01d806da0152d6021d04aa0153be026e03c901542001c9063101542101c906ed01562102fa02ce0157000289036c01571902d602f601577d025f03b0015a3b018d0654015a8a01a307a6015ada024903a9015cfd017e05c9015e2a016506ba015f4b015a0649015f5103530245015f6a019b04dc016049014e069201613601540762016180014806030161c8015907a00161e3015c0568016307013506ef0163ed015d051001647e024f03300166e3010b06d9016743023a03300167890107061601680f014504d901682a014004e40169040215034c016a7702260328016a8e01030563016ab700e60607016b1201550462016b1900e50731016b3d00db06c9016b9d00e805b3016bf600d306c5016c0a02000345016c3c018a03e8016d4200c50642016d6600ca0727016df300cd05b9016e33017403ec016e6d010804c5016e8100b606c5016ea800b8061a016f3500b30709016fa200ab06d6016fd000aa06f30170a8030d023f0171b80341021e01723b028a028f01726400a505830173c00099056e01743e0086076c0174730076071201750d00f8044501761b018b035b01766d026f02890176cb01a1033a017896004a05d80179f5013d0385017a4501360389017b8d0222029c017bfe00f103c8017c55012f0372017c9903170213017d7100d703d3017e0c00950431017ef0fff6073e017ef400b603e7017f3e01b402cf018021011d035101806cffd506a70180ef01650300018180ffcf06030182680113033e0184910047042501886501c50277018c2d00740356018d89008d0326018e4600960312018ed201ea0233018f8900830310019058015e0268019084008702fc01991c010a0238019aef02ab01c0019e30030b01b401a32e00cc01dd01a333ff95027a01a35a009a01ee01aa780078019a01ab2800fe017401ab73ff01022f01abb40276016b01ad710148015401afca0227014701b01101ff014001b1ae01e6013001b200019f012701b241020d013101b59dff15014f01b61e00bd00f701b738003300f001b73fff2b012401b85402ec014d01b86c004800dd01bcd90092009a01bd2bff6000a301c7f703800171"
        );
        SkyMap memory skymap = this.decodeSkyMap(test);

        bytes memory dataURI = abi.encodePacked(
            "{",
            '"name": "',
            "TOKENNAME", //_getTokenName(tokenId),
            '",',
            '"description": "...",',
            '"image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(_getSvg(skymap))),
            '"'
            "}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(dataURI));
    }

    function _getSvg(SkyMap memory skyMap) private view returns (string memory svgXml) {
        string memory pathAll = "";
        //for (uint i = 0; i < constellations.length; i++) {
        console.log(constellations.length);
        for (uint i = 0; i < 2; i++) {
            console.log(constellations[i].name);
            string memory path = "<path d='";
            for (uint j = 0; j < constellations[i].starIds.length; j += 2) {
                if (j + 1 < constellations[i].starIds.length) {
                    console.log("findSkyObjectById, id=");
                    console.logUint(constellations[i].starIds[j]);
                    (SkyObject memory star1, bool found1) = findSkyObjectById(constellations[i].starIds[j], skyMap);
                    console.logUint(star1.id);
                    console.log("findSkyObjectById, id=");
                    console.logUint(constellations[i].starIds[j + 1]);
                    (SkyObject memory star2, bool found2) = findSkyObjectById(constellations[i].starIds[j + 1], skyMap);
                    console.logUint(star2.id);
                    if (!found1 || !found2) {
                        console.log("skip");
                        continue; // Skip to next iteration if any of the objects is not found
                    }
                    console.log("pair found");
                    console.logUint(star1.id);
                    console.logUint(star2.id);
                    path = string(
                        abi.encodePacked(
                            path,
                            "M ",
                            star1.x.toStringSigned(),
                            " ",
                            star1.y.toStringSigned(),
                            " L ",
                            star2.x.toStringSigned(),
                            " ",
                            star2.y.toStringSigned(),
                            " "
                        )
                    );
                }
            }
            path = string.concat(path, "' fill='none' stroke='#fff' stroke-width='3'/>");
            pathAll = string.concat(pathAll, path);
        }

        svgXml = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 ',
            Strings.toString(CANVAS_WIDTH),
            " ",
            Strings.toString(CANVAS_HEIGHT),
            '">',
            "<style><![CDATA[.bg{background-color:#000}"
            ']]></style><path class="bg" d="M0 0h',
            Strings.toString(CANVAS_WIDTH),
            "v",
            Strings.toString(CANVAS_HEIGHT),
            'H0z"/>',
            pathAll,
            '<text x="10" y="10" font-family="Verdana" font-size="30" fill="#fff">',
            skyMap.place,
            "</text>"
            "</svg>"
        );
        //console.log(svgXml);
    }

    // TODO: this is not optimal, needs to be optimized
    // but it costs nothing, because used in view function
    function findSkyObjectById(uint32 id, SkyMap memory skyMap) private pure returns (SkyObject memory, bool) {
        for (uint i = 0; i < skyMap.objects.length; i++) {
            if (skyMap.objects[i].id == id) {
                console.log("star found in skymap.objects by id");
                console.logUint(id);
                return (skyMap.objects[i], true);
            }
        }
        return (SkyObject(0, 0, 0), false); // Return a default object and false
    }

    function createSvgString() public pure returns (string memory) {
        string memory svgString = "<svg xmlns='http://www.w3.org/2000/svg'>";

        svgString = string(abi.encodePacked(svgString, "</svg>"));
        return svgString;
    }
}
