if (typeof AR !== 'undefined' && AR.DICTIONARIES) {
  // This dictionary contains a subset of markers from the ARUCO_4X4_1000 dictionary,
  // re-indexed to be sequential (0, 1, 2, ...).
  // This reduces the size of the dictionary and simplifies marker management.
  AR.DICTIONARIES['ARUCO_4X4_CUSTOM'] = {
    nBits: 16,
    tau: 4,
    // Each entry in codeList is a pair of numbers encoding a 16-bit Aruco marker pattern.
    // For example, the pair [102, 0] can be interpreted as:
    // 102 (decimal) = 01100110 (binary)
    // 0   (decimal) = 00000000 (binary)
    //
    // Combined 16-bit pattern: 0110011000000000
    // This represents the inner 4x4 grid of the marker.
    codeList: [
      [102, 0],      // New ID: 0 (Original ID: 17)
      [55, 172],     // New ID: 1 (Original ID: 467)
      [163, 89],     // New ID: 2 (Original ID: 163)
      [16, 115],     // New ID: 3 (Original ID: 112)
      [245, 197],    // New ID: 4 (Original ID: 946)
      [164, 195],    // New ID: 5 (Original ID: 164)
      [169, 197],    // New ID: 6 (Original ID: 660)
      [42, 15],      // New ID: 7 (Original ID: 13)
      [239, 80],     // New ID: 8 (Original ID: 874)
      [39, 31],      // New ID: 9 (Original ID: 430)
      [253, 246],    // New ID: 10 (Original ID: 959)
      [185, 42],     // New ID: 11 (Original ID: 698)
      [77, 131],     // New ID: 12 (Original ID: 196)
      [59, 158],     // New ID: 13 (Original ID: 434)
      [205, 149],    // New ID: 14 (Original ID: 778)
      [241, 70],     // New ID: 15 (Original ID: 929)
      [18, 177],     // New ID: 16 (Original ID: 110)
      [59, 211],     // New ID: 17 (Original ID: 147)
      [11, 239],     // New ID: 18 (Original ID: 366)
      [244, 53],     // New ID: 19 (Original ID: 942)
      [47, 179],     // New ID: 20 (Original ID: 425)
      [11, 88],      // New ID: 21 (Original ID: 107)
      [2, 226],      // New ID: 22 (Original ID: 340)
      [179, 19],     // New ID: 23 (Original ID: 703)
      [242, 189],    // New ID: 24 (Original ID: 853)
      [115, 83],     // New ID: 25 (Original ID: 575)
      [52, 72],      // New ID: 26 (Original ID: 145)
      [250, 60],     // New ID: 27 (Original ID: 917)
      [54, 238],     // New ID: 28 (Original ID: 460)
      [55, 172],     // New ID: 29 (Original ID: 464)
      [149, 185],    // New ID: 30 (Original ID: 638)
      [197, 147],    // New ID: 31 (Original ID: 794)
      [41, 48],      // New ID: 32 (Original ID: 371)
      [241, 59],     // New ID: 33 (Original ID: 327)
      [243, 167],    // New ID: 34 (Original ID: 898)
      [191, 53],     // New ID: 35 (Original ID: 813)
      [63, 255],     // New ID: 36 (Original ID: 157)
      [246, 176],    // New ID: 37 (Original ID: 941)
      [63, 219],     // New ID: 38 (Original ID: 468)
      [100, 218],    // New ID: 39 (Original ID: 580)
      [87, 210]      // New ID: 40 (Original ID: 486)
    ]
  };
}
