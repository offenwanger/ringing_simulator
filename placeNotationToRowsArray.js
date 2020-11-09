// Place notation from
// http://methods.ringing.org/
let placeNotationToRowArray;
(function () {
    function generateNextRow(previousRow, notation) {
        let nextRow = []
        if (notation == "-") {
            if (previousRow.length % 2 != 0) {
                console.error("Invalid change: " + notation);
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
                        console.error("Notation error: " + notation);
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
                    console.error("Invalid place notation: " + notation[i])
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

    placeNotationToRowArray = function (placeNotionString, numberOfBells) {
        let rowArray = [rounds(numberOfBells)]

        let leadNotationString = placeNotionString.split(",")[0]
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

        let leadEndNotation = placeNotionString.split(",")[1]

        let counter = 0
        do {
            for (let i = 0; i < leadNotation.length; i++) {
                let previousRow = rowArray[rowArray.length - 1]
                let nextRow = generateNextRow(previousRow, leadNotation[i]);
                rowArray.push(nextRow)
            }

            let previousRow = rowArray[rowArray.length - 1]
            let nextRow = generateNextRow(previousRow, leadEndNotation);
            rowArray.push(nextRow)

            if (nextRow.join("") == rowArray[0].join("")) {
                // back at the start, break the loop
                break;
            }

            counter++;
        } while (counter < 7000);
        if(counter >= 7000) {
            return {"success":false};
        }

        return {"result":rowArray, "success":true};
    }
})();