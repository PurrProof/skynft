// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { ERC721Pausable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
//import { console } from "hardhat/console.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { ISvgGenerator } from "./interfaces/ISvgGenerator.sol";
import { IPausable } from "./interfaces/IPausable.sol";
import "./lib/types.sol";
contract SkyNft2 is Ownable, ERC721, ERC721Enumerable, IPausable, ERC721Pausable, ReentrancyGuard {
    // tokenId consists of encoded lat/lon/datetime
    mapping(uint256 tokenId => SkyMap skyMap) private skyMaps;

    error ERC721TokenExists(uint256 tokenId);
    error InvalidSvgGenerator();

    ISvgGenerator private _svgGenerator;

    constructor(
        string memory name_,
        string memory symbol_,
        address svgGenerator
    ) Ownable(msg.sender) ERC721(name_, symbol_) {
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
    ) external nonReentrant {
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

        (string memory svg, string memory tokenName) = _svgGenerator.getSvg(tokenId, skyMaps[tokenId]);

        string memory dataURI = string.concat(
            "{",
            '"name": "SkyMap @',
            tokenName,
            '",',
            '"description": "",',
            '"image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"'
            "}"
        );
        //return string.concat("data:application/json;base64,", Base64.encode(bytes(dataURI)));
        return string.concat("data:application/json;utf8,", _uriEncode(dataURI));
    }

    // https://github.com/iainnash/sol-uriencode/blob/main/src/UriEncode.sol
    // SPDX-License-Identifier: MIT
    function _uriEncode(string memory uri) private pure returns (string memory) {
        bytes memory bytesUri = bytes(uri);

        string memory table = "0123456789abcdef";

        // Max size is worse case all chars need to be encoded
        bytes memory result = new bytes(3 * bytesUri.length);

        /// @solidity memory-safe-assembly
        assembly {
            // Get the lookup table
            let tablePtr := add(table, 1)

            // Prepare result pointer, jump over length
            let resultPtr := add(result, 32)

            // Keep track of the final result size string length
            let resultSize := 0

            for {
                let dataPtr := bytesUri
                let endPtr := add(bytesUri, mload(bytesUri))
            } lt(dataPtr, endPtr) {

            } {
                // advance 1 byte
                dataPtr := add(dataPtr, 1)
                // bytemask out a char
                let input := and(mload(dataPtr), 255)

                // Check if is valid URI character
                let isValidUriChar := or(
                    and(gt(input, 96), lt(input, 134)), // a 97 / z 133
                    or(
                        and(gt(input, 64), lt(input, 91)), // A 65 / Z 90
                        or(
                            and(gt(input, 47), lt(input, 58)), // 0 48 / 9 57
                            or(
                                or(
                                    eq(input, 46), // . 46
                                    eq(input, 95) // _ 95
                                ),
                                or(
                                    eq(input, 45), // - 45
                                    eq(input, 126) // ~ 126
                                )
                            )
                        )
                    )
                )

                switch isValidUriChar
                // If is valid uri character copy character over and increment the result
                case 1 {
                    mstore8(resultPtr, input)
                    resultPtr := add(resultPtr, 1)
                    resultSize := add(resultSize, 1)
                }
                // If the char is not a valid uri character, uriencode the character
                case 0 {
                    mstore8(resultPtr, 37)
                    resultPtr := add(resultPtr, 1)
                    // table[character >> 4] (take the last 4 bits)
                    mstore8(resultPtr, mload(add(tablePtr, shr(4, input))))
                    resultPtr := add(resultPtr, 1)
                    // table & 15 (take the first 4 bits)
                    mstore8(resultPtr, mload(add(tablePtr, and(input, 15))))
                    resultPtr := add(resultPtr, 1)
                    resultSize := add(resultSize, 3)
                }
            }

            // Set size of result string in memory
            mstore(result, resultSize)
        }

        return string(result);
    }

    function pause() public override onlyOwner {
        _pause();
    }

    function unpause() public override onlyOwner {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
