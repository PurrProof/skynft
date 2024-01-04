// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

library SkyNftUtils {
    using Strings for uint32;
    int64 private constant GEO_PRECISION = 10_000_000; // 7 decimal places
    uint64 private constant COORDS_DECIMAL_PLACES = 7;

    function unpackCoords(uint24 coords) internal pure returns (int16 x, int16 y) {
        //unpack to int16, because later we'll calculate delta, which could be negative
        x = int16(uint16(coords >> 12)); // Extract the higher 12 bits for x
        y = int16(uint16(coords & 0xFFF)); // Extract the lower 12 bits for y
        return (x, y);
    }

    function isBitSet(bytes1 b, uint16 position) internal pure returns (bool) {
        require(position < 8, "Position out of range");
        bytes1 mask = bytes1(uint8(1 << position));
        return b & mask != 0;
    }

    function isBitSet(uint256 val, uint8 position) internal pure returns (bool) {
        require(position < 256, "Position out of range");
        uint256 mask = uint256(1 << position);
        return val & mask != 0;
    }

    // functions for other bytes types could be added
    function bytesToString(bytes24 data) internal pure returns (string memory) {
        return _bytesToString(abi.encodePacked(data));
    }

    // Generic private function
    function _bytesToString(bytes memory data) private pure returns (string memory) {
        uint256 length;
        for (length = 0; length < data.length; length++) {
            if (data[length] == 0) {
                break;
            }
        }
        bytes memory bytesArray = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            bytesArray[i] = data[i];
        }
        return string(bytesArray);
    }

    function _datetimeString(uint32 datetime) private pure returns (string memory dtStr) {
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

    function _coordString(int64 value) private pure returns (string memory) {
        string memory numStr = Strings.toString(uint64(value >= 0 ? value : -value));
        string memory sign = value < 0 ? "-" : "";
        bytes1 decimalPoint = bytes1(uint8(46)); // ASCII code for '.'

        // Handle case where the number of digits is less than or equal to the decimal places
        if (bytes(numStr).length <= COORDS_DECIMAL_PLACES) {
            return string(abi.encodePacked(sign, "0.", _padStart(numStr, uint8(COORDS_DECIMAL_PLACES), "0")));
        }

        bytes memory strBytes = bytes(numStr);
        bytes memory formatted = new bytes(strBytes.length + 1); // +1 for the decimal point

        uint256 insertPoint = strBytes.length - uint256(COORDS_DECIMAL_PLACES);
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

    function _padStart(string memory str, uint8 length, string memory padChar) private pure returns (string memory) {
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

    // tokenId is: 32 bits latitude, 32 bits longitude, 32 bits datetime
    function getDateTime(uint256 tokenId) internal pure returns (string memory str) {
        uint32 datetime = uint32(tokenId & 0xFFFFFFFF);
        return _datetimeString(datetime);
    }

    function getCoords(uint256 tokenId) internal pure returns (string memory coords) {
        int64 lat = int64(uint64((tokenId >> 64) & 0xFFFFFFFF)) - 90 * GEO_PRECISION;
        int64 lon = int64(uint64((tokenId >> 32) & 0xFFFFFFFF)) - 180 * GEO_PRECISION;
        return string.concat(_coordString(lat), ", ", _coordString(lon));
    }
}
