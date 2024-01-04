// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

struct SkyMap {
    // bitmap of named stars ids, which coordinates are present in starsCoords array
    uint256 namedStarsBitMap;
    // bitmap of ids of constellations, visible on this skymap; 0th bit is Constellations.Aql etc
    uint96 constlBitMap;
    // constellations stars x, y coordinates encoded as uint24; 12 bits per x/y, it's a [0;4095] incl. range;
    // coordinates ordered by constellation index ASC, star index in constellation ASC
    uint24[] starsCoords;
    // indexes of named stars coordinates in starsCoords array, according to namedStarsBitMap
    uint16[] namedStarsCoordsIndexes;
    // bitmap of visible stars indexes per constellation
    // 0th star of 0th constellation is in 1st bit of 0th byte
    // 1st star of 0th constellation is in 2nd bit of 0th byte etc
    // bitmap is padded with zeros to be correct bytes value
    bytes constlStarsBitMap;
}
