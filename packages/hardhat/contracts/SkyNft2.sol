// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
//import { console } from "hardhat/console.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { ISvgGenerator } from "./interfaces/ISvgGenerator.sol";
import "./lib/types.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract SkyNft2 is ERC721 {
    // tokenId consists of encoded lat/lon/datetime
    mapping(uint256 tokenId => SkyMap skyMap) private skyMaps;

    error ERC721TokenExists(uint256 tokenId);
    error InvalidSvgGenerator();

    ISvgGenerator private _svgGenerator;

    constructor(string memory name_, string memory symbol_, address svgGenerator) ERC721(name_, symbol_) {
        if (
            svgGenerator.code.length == 0 || !IERC165(svgGenerator).supportsInterface(type(ISvgGenerator).interfaceId)
        ) {
            revert InvalidSvgGenerator();
        }
        _svgGenerator = ISvgGenerator(svgGenerator);
    }

    function mint(
        address recipient,
        /*uint32 latitude,
        uint32 longitude,
        uint32 datetime,*/
        uint96 tokenId,
        uint96 constlBitMap,
        bytes calldata constlStarsBitMap,
        uint256 namedStarsBitMap,
        uint16[] calldata namedStarsCoordsIndexes,
        uint24[] calldata starsCoords
    ) external {
        //uint256 newTokenId = _encodeTokenId(latitude, longitude, datetime);
        uint256 newTokenId = uint256(tokenId);
        if (skyMaps[newTokenId].constlBitMap > 0) {
            revert ERC721TokenExists(newTokenId);
        }
        _svgGenerator.validateInput(constlBitMap, constlStarsBitMap);

        skyMaps[newTokenId] = SkyMap(
            namedStarsBitMap,
            constlBitMap,
            starsCoords,
            namedStarsCoordsIndexes,
            constlStarsBitMap
        );
        _safeMint(recipient, newTokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory uri) {
        if (skyMaps[tokenId].constlBitMap == 0) {
            revert ERC721NonexistentToken(tokenId);
        }

        string memory svg = _svgGenerator.getSvg(tokenId, skyMaps[tokenId]);

        bytes memory dataURI = abi.encodePacked(
            "{",
            '"name": "',
            _getTokenName(tokenId),
            '",',
            '"description": "",',
            '"image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"'
            "}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(dataURI));
    }

    function _getTokenName(uint256 tokenId) private pure returns (string memory name) {
        // TODO: decode coords and time
        return string.concat("SkyMap #", Strings.toString(tokenId));
    }
}
