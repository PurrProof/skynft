// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import { ISvgGenerator } from "./interfaces/ISvgGenerator.sol";
import { SkyMap } from "./lib/types.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { SkyNftUtils } from "./lib/utils.sol";
import { SkyNftSvgStarNames } from "./SkyNftSvgStarNames.sol";

/* solhint-disable-next-line */
/*enum Constellations { Aql, And, Scl, Ara, Lib, Cet, Ari, Sct, Pyx, Boo, Cae, Cha, Cnc, Cap, Car, Cas,
        Cen, Cep, Com, CVn, Aur, Col, Cir, Crt, CrA, CrB, Crv, Cru, Cyg, Del, Dor, Dra, Nor, Eri, Sge, For,
        Gem, Cam, CMa, UMa, Gru, Her, Hor, Hya, Hyi, Ind, Lac, Mon, Lep, Leo, Lup, Lyn, Lyr, Ant, Mic, Mus,
        Oct, Aps, Oph, Ori, Pav, Peg, Pic, Per, Equ, CMi, LMi, Vul, UMi, Phe, Psc, PsA, Vol, Pup, Ret, Sgr,
        Sco, Ser, Sex, Men, Tau, Tel, Tuc, Tri, TrA, Aqr, Vir, Vel }*/

contract SkyNftSvgGenerator is ISvgGenerator {
    using Strings for int16;

    // TODO changeable?
    int16 private constant CANVAS_WIDTH = 1024;
    int16 private constant CANVAS_HEIGHT = 1024;

    // count of stars in constellation shapes
    // prettier-ignore
    // solhint-disable-next-line
    uint8[88] private constlStarsCount = [9,6,3,7,5,19,4,5,3,9,3,3,6,9,15,5,17,5,3,2,6,7,3,8,10,7,6,4,10,5,5,15,4,28,5,2,17,5,16,18,9,18,3,18,5,3,6,7,13,9,12,8,5,2,3,4,3,3,7,20,11,14,3,11,4,2,4,2,7,8,18,7,6,7,4,21,13,12,2,2,12,2,4,3,3,15,12,10];

    uint8[][88] private constlFigures;
    struct Coords {
        int16 x;
        int16 y;
    }
    struct Star {
        Coords coords;
        bool isVisible;
    }
    struct Bounds {
        Coords topLeft;
        Coords bottomRight;
    }
    error ConstellationsInputEmpty();
    error ConstellationsWrongBitmap(uint96 constlBitMap);

    constructor() {
        // TODO: this can be defined much more cheap as bitmap
        constlFigures[0] = [7, 5, 5, 4, 5, 3, 3, 6, 8, 6, 3, 1, 1, 0, 3, 2];
        constlFigures[1] = [0, 1, 1, 4, 5, 4, 4, 3, 3, 2];
        constlFigures[2] = [2, 0, 0, 1, 1, 2];
        constlFigures[3] = [6, 5, 5, 1, 1, 0, 0, 4, 4, 3, 3, 2, 2, 6];
        constlFigures[4] = [4, 3, 3, 2, 2, 0, 0, 1, 1, 3];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[5] = [6,9,4,1,1,0,1,2,2,3,3,5,5,8,8,13,13,15,15,10,10,4,7,13,7,12,12,14,14,18,18,17,17,16,16,9,9,11,11,14];
        constlFigures[6] = [3, 2, 2, 1, 1, 0];
        constlFigures[7] = [2, 3, 3, 4, 4, 0, 0, 1, 1, 2];
        constlFigures[8] = [0, 1, 1, 2];
        constlFigures[9] = [5, 2, 2, 6, 6, 8, 8, 7, 7, 4, 4, 3, 3, 2, 2, 1, 1, 0];
        constlFigures[10] = [0, 1, 1, 2];
        constlFigures[11] = [0, 1, 1, 2];
        constlFigures[12] = [4, 2, 2, 1, 2, 3, 3, 0, 3, 5];
        constlFigures[13] = [0, 1, 1, 4, 4, 5, 5, 7, 7, 8, 5, 6, 6, 4, 1, 2, 4, 3];
        // prettier-ignore
        constlFigures[14] = [6,8,8,11,11,12,12,14,14,13,13,10,10,9,9,7,4,3,3,0,5,7,5,4,0,1,3,2];
        constlFigures[15] = [4, 3, 3, 2, 2, 1, 1, 0];
        // prettier-ignore
        constlFigures[16] = [15,12,12,7,7,10,10,11,11,9,9,8,8,6,6,5,8,13,9,14,14,16,10,4,4,3,3,2,2,0,0,1];
        constlFigures[17] = [2, 3, 3, 1, 1, 0, 0, 2, 3, 4, 4, 1];
        constlFigures[18] = [1, 2, 2, 0];
        constlFigures[19] = [0, 1];
        constlFigures[20] = [5, 4, 4, 2, 2, 1, 1, 0, 3, 0, 3, 5];
        constlFigures[21] = [6, 5, 5, 3, 3, 2, 2, 4, 2, 1, 1, 0];
        constlFigures[22] = [0, 2, 0, 1];
        constlFigures[23] = [0, 1, 1, 4, 4, 2, 2, 0, 2, 3, 3, 5, 5, 7, 7, 6, 6, 4];
        constlFigures[24] = [1, 3, 3, 4, 4, 6, 6, 8, 8, 9, 9, 7, 7, 5, 5, 2, 1, 0];
        constlFigures[25] = [1, 0, 0, 2, 2, 3, 3, 4, 4, 5, 5, 6];
        constlFigures[26] = [4, 3, 3, 2, 2, 1, 1, 0, 1, 5, 5, 3];
        constlFigures[27] = [2, 1, 3, 0];
        constlFigures[28] = [0, 1, 1, 3, 3, 5, 5, 6, 5, 7, 7, 8, 8, 9, 5, 4, 4, 2];
        constlFigures[29] = [0, 1, 1, 2, 2, 4, 4, 3, 3, 1];
        constlFigures[30] = [3, 4, 4, 2, 2, 3, 2, 1, 1, 0];
        // prettier-ignore
        constlFigures[31] = [9,10,10,7,7,8,8,9,9,12,12,14,14,13,13,11,11,6,6,5,5,4,4,3,3,2,2,1,1,0];
        constlFigures[32] = [1, 2, 2, 3, 3, 0, 0, 2, 0, 1];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[33] = [0,1,1,2,2,3,3,4,4,5,5,8,8,12,12,17,17,18,18,19,19,20,20,21,21,16,16,14,14,11,11,9,9,6,6,7,7,10,10,13,13,15,15,22,22,24,24,25,25,26,26,27,27,23];
        constlFigures[34] = [1, 2, 2, 0, 2, 3, 3, 4];
        constlFigures[35] = [0, 1];
        // prettier-ignore
        constlFigures[36] = [4,8,8,11,11,10,10,6,11,14,14,15,14,16,14,12,12,9,9,13,9,7,9,5,5,3,5,2,2,1,1,0];
        constlFigures[37] = [0, 2, 2, 3, 0, 1, 1, 3, 1, 4];
        // prettier-ignore
        constlFigures[38] = [6,12,12,8,8,4,4,11,11,13,13,14,14,15,9,10,10,13,10,7,7,3,3,2,3,1,3,4,9,5,0,9,8,6];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[39] = [17,16,16,15,15,14,14,10,10,9,9,13,13,14,13,12,12,11,11,7,11,8,9,6,6,4,4,2,4,1,6,5,5,0,0,3,3,10];
        constlFigures[40] = [7, 3, 3, 2, 2, 4, 4, 8, 8, 7, 4, 6, 4, 5, 2, 1, 1, 0];
        // prettier-ignore
        constlFigures[41] = [13,15,15,11,11,10,10,9,9,6,6,4,4,1,1,0,6,5,5,3,3,2,5,7,7,12,12,8,14,16,16,17,7,9,14,12];
        constlFigures[42] = [2, 0, 0, 1];
        // prettier-ignore
        constlFigures[43] = [2,1,1,0,0,3,3,4,4,2,4,5,5,6,6,9,9,8,8,7,7,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17];
        constlFigures[44] = [0, 4, 4, 3, 3, 2, 2, 1];
        constlFigures[45] = [2, 0, 0, 1, 1, 2];
        constlFigures[46] = [0, 4, 4, 3, 3, 2, 2, 1, 1, 5, 5, 3];
        constlFigures[47] = [1, 3, 3, 4, 4, 2, 2, 0, 4, 6, 6, 5];
        // prettier-ignore
        constlFigures[48] = [12,11,11,9,9,7,7,2,7,10,10,8,8,6,6,0,7,6,2,4,2,3,0,2,3,1,4,5];
        // prettier-ignore
        constlFigures[49] = [8,7,7,3,3,2,2,5,5,6,6,8,5,4,4,1,1,0,6,7];
        // prettier-ignore
        constlFigures[50] = [9,11,11,10,10,9,10,7,7,5,5,6,5,3,7,8,8,4,4,2,4,1,2,0,2,3];
        constlFigures[51] = [7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0];
        constlFigures[52] = [0, 1, 1, 2, 2, 4, 4, 3, 3, 1];
        constlFigures[53] = [1, 0];
        constlFigures[54] = [2, 1, 1, 0];
        constlFigures[55] = [3, 0, 0, 1, 1, 2, 2, 3];
        constlFigures[56] = [1, 2, 2, 0, 0, 1];
        constlFigures[57] = [0, 1, 1, 2];
        constlFigures[58] = [5, 6, 3, 6, 5, 2, 2, 0, 0, 1, 1, 3, 3, 4];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[59] = [11,10,10,8,19,18,19,16,16,13,18,17,17,13,18,15,15,14,14,11,11,12,12,6,6,8,8,7,7,9,9,14,7,0,0,2,2,3,3,5,0,1,1,4,17,15];
        // prettier-ignore
        constlFigures[60] = [8,10,10,9,9,7,7,8,7,6,6,3,3,5,5,7,5,4,4,2,2,1,1,4,1,0];
        // prettier-ignore
        constlFigures[61] = [1,13,12,8,8,5,12,11,11,9,9,4,4,3,13,10,10,7,7,6,6,2,0,12,0,1,12,13];
        constlFigures[62] = [2, 1, 1, 0];
        constlFigures[63] = [7, 8, 8, 10, 10, 9, 9, 6, 6, 5, 5, 2, 2, 1, 5, 4, 4, 3, 3, 0];
        constlFigures[64] = [0, 1, 1, 3, 3, 2, 2, 0];
        constlFigures[65] = [1, 0];
        constlFigures[66] = [3, 2, 2, 1, 1, 0, 1, 3];
        constlFigures[67] = [0, 1];
        constlFigures[68] = [0, 6, 6, 5, 5, 3, 3, 4, 4, 2, 2, 1, 1, 3];
        constlFigures[69] = [4, 3, 3, 1, 1, 4, 3, 6, 6, 7, 7, 3, 3, 5, 5, 1, 1, 2, 2, 0, 0, 1];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[70] = [2,4,2,5,5,4,4,7,7,9,9,11,11,10,10,8,8,6,6,3,3,1,1,0,0,17,17,15,15,16,16,13,13,12,12,14,14,15];
        constlFigures[71] = [6, 4, 4, 1, 1, 0, 0, 2, 2, 3, 3, 5];
        constlFigures[72] = [2, 0, 0, 3, 3, 2, 3, 1, 3, 4, 4, 5, 5, 3];
        constlFigures[73] = [6, 4, 4, 2, 2, 0, 0, 1, 1, 3, 3, 5, 5, 6];
        constlFigures[74] = [2, 3, 3, 1, 1, 0, 0, 2];
        // prettier-ignore
        // solhint-disable-next-line
        constlFigures[75] = [4,6,3,5,5,1,1,0,1,4,4,5,5,10,10,7,7,4,7,6,6,2,10,12,12,8,8,7,8,9,9,11,11,13,13,14,12,17,17,20,20,19,19,18,18,16,18,15];
        // prettier-ignore
        constlFigures[76] = [9,11,11,12,12,10,10,8,8,7,7,6,6,5,5,4,4,3,3,1,3,0,3,2];
        // prettier-ignore
        constlFigures[77] = [4,5,5,1,1,0,0,2,2,6,6,3,3,2,11,10,10,9,9,8,8,7];
        constlFigures[78] = [1, 0];
        constlFigures[79] = [1, 0];
        // prettier-ignore
        constlFigures[80] = [10,9,9,6,8,11,3,4,3,2,2,0,8,6,8,7,7,3,6,5,5,4,4,1];
        constlFigures[81] = [1, 0];
        constlFigures[82] = [2, 3, 3, 0, 3, 1];
        constlFigures[83] = [2, 1, 1, 0, 0, 2];
        constlFigures[84] = [2, 0, 0, 1, 1, 2];
        // prettier-ignore
        constlFigures[85] = [1,2,2,5,5,6,6,8,8,10,10,13,13,14,2,4,4,3,4,7,7,9,9,11,11,12,0,1];
        // prettier-ignore
        constlFigures[86] = [0,1,1,2,2,5,5,8,8,9,9,10,5,6,6,7,7,11,6,3,3,4,3,2];
        constlFigures[87] = [0, 1, 1, 2, 2, 4, 4, 6, 6, 9, 9, 8, 8, 7, 7, 5, 5, 3, 3, 0];
    }

    function validateInput(uint96 constlBitMap, bytes calldata constlStarsBitMap) external view {
        if (constlBitMap == 0 || constlStarsBitMap.length == 0) {
            revert ConstellationsInputEmpty();
        } else if (constlBitMap & uint96(0xFF << constlStarsCount.length) != 0) {
            revert ConstellationsWrongBitmap(constlBitMap);
        }
        // TODO what else could we check but not analyzing structures to deep?
        // TODO: validate lat/lon limits
        // uint32 private constant GEO_PRECISION = 10_000_000; // 7 decimal places
        // skyMap.latitude = int64(uint64(latitude)) - 90 * int64(GEO_PRECISION);
        // skyMap.longitude = int64(uint64(longitude)) - 180 * int64(GEO_PRECISION);
    }

    function _getSvgConstellations(SkyMap calldata skymap) private view returns (string memory svg) {
        uint16 starId = 0;
        uint8 constlInputIndex = 0;
        uint16 shift = 0;
        for (uint8 i = 0; i < constlFigures.length; i++) {
            if ((skymap.constlBitMap & (uint96(1) << i)) == 0) {
                continue;
            }
            uint8 starsCount = constlStarsCount[i];
            uint32 constlStarsBitMap = _getConstlStarsBitmap(skymap.constlStarsBitMap, shift, starsCount);
            // starsCount is always less than 32 (28 maximum)
            Star[] memory constlStars = new Star[](32);
            for (uint8 j = 0; j < starsCount; j++) {
                if ((constlStarsBitMap & (uint32(1) << j)) != 0) {
                    // star is marked as visible in bitmap
                    (int16 x, int16 y) = SkyNftUtils.unpackCoords(skymap.starsCoords[starId]);
                    constlStars[j] = Star(Coords(x, y), true);
                    // we took star from starsCoords array, next time we'll take next star
                    starId++;
                } else {
                    // star is marked as invisible in bitmap
                    constlStars[j] = Star(Coords(0, 0), false);
                }
            }
            shift += starsCount;

            // draw constellations
            string memory path = string.concat("<path d='");
            string memory stars = "";
            // init bounds, topLeft=Coords(CANVAS_WIDTH, CANVAS_HEIGHT), bottomRight=Coords(0,0)
            // then bounds will be adjusted
            Bounds memory bounds = Bounds(Coords(CANVAS_WIDTH, CANVAS_HEIGHT), Coords(0, 0));

            // 28 stars is max counts of stars in constellation
            uint256[28] memory drawnStars;
            bool started = false;
            for (uint8 k = 0; k < constlFigures[i].length; k += 2) {
                uint8 pairFirstStarIndex = constlFigures[i][k];
                uint8 pairSecondStarIndex = constlFigures[i][k + 1];
                if (!constlStars[pairFirstStarIndex].isVisible || !constlStars[pairSecondStarIndex].isVisible) {
                    continue;
                }
                // if first pair, or pair 1st star != prev. pair last star, move cursor to new position
                if (
                    !started ||
                    constlStars[constlFigures[i][k - 1]].coords.x != constlStars[pairFirstStarIndex].coords.x ||
                    constlStars[constlFigures[i][k - 1]].coords.y != constlStars[pairFirstStarIndex].coords.y
                ) {
                    started = true;
                    string memory x = constlStars[pairFirstStarIndex].coords.x.toStringSigned();
                    string memory y = constlStars[pairFirstStarIndex].coords.y.toStringSigned();
                    path = string.concat(path, "M", x, " ", y);
                    if (drawnStars[pairFirstStarIndex] != 1) {
                        stars = string.concat(stars, '<use href="#s" x="', x, '" y="', y, '"/>');
                        drawnStars[pairFirstStarIndex] = 1;
                    }
                    bounds = _adjustBounds(bounds, constlStars[pairFirstStarIndex].coords);
                }

                bounds = _adjustBounds(bounds, constlStars[pairSecondStarIndex].coords);
                if (drawnStars[pairSecondStarIndex] != 1) {
                    stars = string.concat(
                        stars,
                        '<use href="#s" x="',
                        constlStars[pairSecondStarIndex].coords.x.toStringSigned(),
                        '" y="',
                        constlStars[pairSecondStarIndex].coords.y.toStringSigned(),
                        '"/>'
                    );
                    drawnStars[pairSecondStarIndex] = 1;
                }

                int16 dx = constlStars[pairSecondStarIndex].coords.x - constlStars[pairFirstStarIndex].coords.x;
                int16 dy = constlStars[pairSecondStarIndex].coords.y - constlStars[pairFirstStarIndex].coords.y;
                path = string.concat(path, "l", dx.toStringSigned(), " ", dy.toStringSigned());
            }

            if (bytes(stars).length > 0) {
                svg = string.concat(
                    svg,
                    '<g class="cstl">',
                    _getConstlNameText(i, bounds),
                    path,
                    "'/>",
                    stars,
                    "</g>\n"
                );
            }

            // now increase constlInputIndex, it will be used for next visible constellation;
            constlInputIndex++;
        }
    }

    function getSvg(
        uint256 tokenId,
        SkyMap calldata skymap
    ) external view returns (string memory svgXml, string memory tokenName) {
        string memory coords = SkyNftUtils.getCoords(tokenId);
        string memory datetime = SkyNftUtils.getDateTime(tokenId);
        string memory halfW = Strings.toStringSigned(CANVAS_WIDTH / 2);
        string memory halfH = Strings.toStringSigned(CANVAS_HEIGHT / 2);
        string memory bottomArcPath = string.concat(
            '<path id="arcb" d="M0 ',
            halfH,
            "A",
            halfW,
            " ",
            halfH,
            " 0 0 0 ",
            CANVAS_WIDTH.toStringSigned(),
            " ",
            halfH,
            '" fill="none"/>'
        );
        svgXml = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 ',
            CANVAS_WIDTH.toStringSigned(),
            " ",
            CANVAS_HEIGHT.toStringSigned(),
            // .st r:5px does not work on some svg renderers, so put it into <circle>
            '"><style><![CDATA[svg{background:#0A0A23}'
            "text{text-anchor:middle;dominant-baseline:middle;font-family:Verdana;}"
            "g.s1 text{font-size:16px;fill:#FFF;transform:translateY(-15px);display:none}"
            'g.s1 use[href="#s1"]{fill:#FFF;cursor:crosshair}'
            "g.s1:hover text{display:block}"
            '.cstl text,.cstl use[href="#s"]{fill:#8A8AB5;transition:fill 0.3s}'
            ".cstl text{font-size:17px}"
            ".cstl path{stroke:#8A8AB5;stroke-width:1px;fill-opacity:0;"
            "filter:url(#glow);transition:stroke 0.3s,stroke-width 0.3s}"
            ".cstl:hover{cursor:pointer}"
            '.cstl:hover text,.cstl:hover use[href="#s"]{fill:#d0d0f5;font-weight:bold}'
            ".cstl:hover path{stroke-dasharray:none;stroke:#d0d0f5;stroke-width:2px}"
            ".circ {fill:transparent;stroke:#f5e0d0;stroke-width:2%;pointer-events:none}"
            ".ln,.le,.ls,.lw{fill:#000;font-weight:bold;font-size:20px}"
            ".ln{transform:translateY(12px)}.ls{transform:translateY(-8px)}"
            ".lw{transform:translateX(10px)}.le{transform:translateX(-10px)}"
            "text.arcb{transform:translateY(-12px);letter-spacing:1px;font-size:18px;fill: #000;}"
            ']]></style><defs><filter id="glow">'
            '<feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />'
            '<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur4" />'
            '<feMerge><feMergeNode in="blur2" /><feMergeNode in="blur4" /><feMergeNode in="SourceGraphic" /></feMerge>'
            '</filter><symbol id="s" width="2" height="2" viewBox="-1 -1 2 2" x="-1" y="-1">'
            '<circle r="1" cx="0" cy="0"/></symbol>'
            '<symbol id="s1" width="6" height="6" viewBox="-3 -3 6 6" x="-3" y="-3">'
            '<circle r="3" cx="0" cy="0"/></symbol></defs>',
            _getSvgConstellations(skymap),
            SkyNftSvgStarNames.getCode(skymap),
            '\n<circle cx="50%" cy="50%" r="49%" class="circ" />'
            '<text x="50%" y="0" class="ln">N</text>'
            '<text x="50%" y="100%" class="ls">S</text>'
            '<text x="100%" y="50%" class="le">E</text>'
            '<text x="0" y="50%" class="lw">W</text>\n',
            bottomArcPath,
            _getBottomArcText(coords, 25),
            _getBottomArcText(datetime, 75),
            "</svg>"
        );
        tokenName = string.concat(coords, " ", datetime);
    }

    function _getBottomArcText(string memory text, uint256 offsetPercent) private pure returns (string memory code) {
        code = string.concat(
            '<text class="arcb"><textPath href="#arcb" startOffset="',
            Strings.toString(offsetPercent),
            '%">',
            text,
            "</textPath></text>"
        );
    }

    function _getConstlStarsBitmap(bytes memory data, uint16 start, uint8 length) private pure returns (uint32 result) {
        require(length > 0, "Length must be greater than 0");
        uint16 end = start + length - 1;
        require(end < data.length * 8, "Bit range exceeds data length");

        uint32 currentBit = 0;

        for (uint16 i = start; i <= end; i++) {
            uint16 byteIndex = i / 8;
            uint16 bitIndex = i % 8;

            if (SkyNftUtils.isBitSet(data[byteIndex], bitIndex)) {
                result |= (uint32(1) << currentBit);
            }
            currentBit++;
        }
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(ISvgGenerator).interfaceId;
    }

    function _adjustBounds(Bounds memory bounds, Coords memory coord) private pure returns (Bounds memory) {
        bounds.topLeft.x = (coord.x < bounds.topLeft.x) ? coord.x : bounds.topLeft.x;
        bounds.topLeft.y = (coord.y < bounds.topLeft.y) ? coord.y : bounds.topLeft.y;
        bounds.bottomRight.x = (coord.x > bounds.bottomRight.x) ? coord.x : bounds.bottomRight.x;
        bounds.bottomRight.y = (coord.y > bounds.bottomRight.y) ? coord.y : bounds.bottomRight.y;

        return bounds;
    }

    function _getConstlNameText(
        uint8 constlIndex,
        Bounds memory bounds
    ) private pure returns (string memory constlNameText) {
        bytes24[88] memory constlNames = [
            bytes24("Aquila"),
            "Andromeda",
            "Sculptor",
            "Ara",
            "Libra",
            "Cetus",
            "Aries",
            "Scutum",
            "Pyxis",
            "Bootes",
            "Caelum",
            "Chamaeleon",
            "Cancer",
            "Capricornus",
            "Carina",
            "Cassiopeia",
            "Centaurus",
            "Cepheus",
            "Coma Berenices",
            "Canes Venatici",
            "Auriga",
            "Columba",
            "Circinus",
            "Crater",
            "Corona Australis",
            "Corona Borealis",
            "Corvus",
            "Crux",
            "Cygnus",
            "Delphinus",
            "Dorado",
            "Draco",
            "Norma",
            "Eridanus",
            "Sagitta",
            "Fornax",
            "Gemini",
            "Camelopardalis",
            "Canis Major",
            "Ursa Major",
            "Grus",
            "Hercules",
            "Horologium",
            "Hydra",
            "Hydrus",
            "Indus",
            "Lacerta",
            "Monoceros",
            "Lepus",
            "Leo",
            "Lupus",
            "Lynx",
            "Lyra",
            "Antlia",
            "Microscopium",
            "Musca",
            "Octans",
            "Apus",
            "Ophiuchus",
            "Orion",
            "Pavo",
            "Pegasus",
            "Pictor",
            "Perseus",
            "Equuleus",
            "Canis Minor",
            "Leo Minor",
            "Vulpecula",
            "Ursa Minor",
            "Phoenix",
            "Pisces",
            "Piscis Austrinus",
            "Volans",
            "Puppis",
            "Reticulum",
            "Sagittarius",
            "Scorpius",
            "Serpens",
            "Sextans",
            "Mensa",
            "Taurus",
            "Telescopium",
            "Tucana",
            "Triangulum",
            "Triangulum Australe",
            "Aquarius",
            "Virgo",
            "Vela"
        ];

        return
            string.concat(
                '<text x="',
                ((bounds.topLeft.x + bounds.bottomRight.x) / 2).toStringSigned(),
                '" y="',
                ((bounds.topLeft.y + bounds.bottomRight.y) / 2).toStringSigned(),
                '">',
                SkyNftUtils.bytesToString(constlNames[constlIndex]),
                "</text>"
            );
    }
}
