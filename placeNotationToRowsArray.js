// Place notation from
// http://methods.ringing.org/
let placeNotationToRowArray;
let getRoundsRowArray;
(function () {
    function enoughBellsForPlaceNotation(notation, numberOfBells) {
        let highestNotation = 0;

        for (var i = 0; i < notation.length; i++) {
            try {
                let num = notationToArrayIndex(notation.charAt(i))
                if(num > highestNotation) {
                    highestNotation = num;
                }
            } catch {}
        }

        // If the highest notation (say T) is less than the number of bells (say 12), return true. 
        return highestNotation <= numberOfBells;
    }

    function generateNextRow(previousRow, notation) {
        let nextRow = []
        if (notation == "-") {
            if (previousRow.length % 2 != 0) {
                throw ("Invalid change: " + notation);
            }
            for (let i = 0; i < previousRow.length; i += 2) {
                nextRow.push(previousRow[i + 1])
                nextRow.push(previousRow[i])
            }
        } else {
            let notationArray = notationToArrayIndex(notation)
            for (let i = 0; i < previousRow.length; i++) {
                if (notationArray.includes(i + 1) || i == previousRow.length - 1) {
                    // if place is in place notation, add whatever was in that place.
                    // or we're the last place, 
                    nextRow.push(previousRow[i])
                } else {
                    if (notationArray.includes(i + 2)) {
                        throw ("Notation error: " + notation);
                    } else {
                        // reverse i and i + 1
                        // This will not cause a arrayOutOfBounds because this can't be the last item in the array
                        nextRow.push(previousRow[i + 1])
                        nextRow.push(previousRow[i])
                        // skip the next i
                        i++;
                    }
                }
            }
        }

        return nextRow;
    }

    function notationToArrayIndex(notation) {
        let result = [];
        for (let i = 0; i < notation.length; i++) {
            let num = parseInt(notation[i]);
            if (isNaN(num)) {
                if (notation[i] == "E") {
                    result.push(11);
                } else if (notation[i] == "T") {
                    result.push(12);
                } else {
                    throw ("Invalid place notation: " + notation[i])
                }
            } else if (num == 0) {
                result.push(10);
            } else {
                result.push(num)
            }
        }

        return result;
    }

    function rounds(numberOfBells) {
        let rowArr = [];
        for (let i = 1; i <= numberOfBells; i++) {
            rowArr.push(i);
        }
        return rowArr;
    }

    function convertPlaceNotationToRowArray(placeNotionString, numberOfBells) {
        if(!placeNotionString) {
            return { "success": false, "error": "No notation" };
        }

        if(!enoughBellsForPlaceNotation(placeNotionString, numberOfBells)) {
            return { "success": false, "error": "Too few bells for this method" };
        }

        let rowArray = [rounds(numberOfBells)]
        let fullNotation = []

        for(let i = 0;i<placeNotionString.split(",").length;i++) {
            let leadNotationString = placeNotionString.split(",")[i]
            let isSymetric = false;
            if (leadNotationString[0] == "&") {
                leadNotationString = leadNotationString.substring(1);
                isSymetric = true;
            }

            let leadNotation = []
            let currentNotation = "";
            for (let i = 0; i < leadNotationString.length; i++) {
                if (leadNotationString[i] == "-" || leadNotationString[i] == ".") {
                    if (currentNotation.length > 0) {
                        leadNotation.push(currentNotation)
                    }
                    currentNotation = "";

                    if (leadNotationString[i] == "-") {
                        leadNotation.push("-")
                    }
                } else {
                    currentNotation = currentNotation + leadNotationString[i]
                }
            }
            leadNotation.push(currentNotation)

            if (isSymetric) {
                // reverse through the lead, not including the last change notation
                for (let i = leadNotation.length - 2; i >= 0; i--) {
                    leadNotation.push(leadNotation[i])
                }
            }

            fullNotation = fullNotation.concat(leadNotation)
        }

        let counter = 0
        do {
            for (let i = 0; i < fullNotation.length; i++) {
                let previousRow = rowArray[rowArray.length - 1]
                let nextRow 
                try {
                    nextRow = generateNextRow(previousRow, fullNotation[i]);
                } catch(err) {
                    return { "success": false, "error":err };
                }
                rowArray.push(nextRow)
            }

            if (rowArray[rowArray.length - 1].join("") == rowArray[0].join("")) {
                // back at the start, break the loop
                break;
            }

            counter++;
        } while (counter < 7000);
    
        if (counter >= 7000) {
            return { "success": false, "error":"Does not come round" };
        }

        return { "result": rowArray, "success": true };
    }
    
    getRoundsRowArray = rounds;
    placeNotationToRowArray = convertPlaceNotationToRowArray;
})();