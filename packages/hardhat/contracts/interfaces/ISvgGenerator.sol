// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { SkyMap } from "../lib/types.sol";

interface ISvgGenerator is IERC165 {
    function getSvg(
        uint256 tokenId,
        SkyMap calldata skymap
    ) external view returns (string memory svgXml, string memory tokenName);

    function validateInput(uint96 constlBitMap, bytes calldata constlStarsBitMap) external;
}
