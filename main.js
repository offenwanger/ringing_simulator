
(function () {
    const DEBUG = true
    function log(str) {
        if (DEBUG) console.log(str)
    }

    let c = simulatorConstants

    let rowNumber = 0

    let bellInterval = -1;
    let gracePeriod = -1;

    let numberOfbells = -1;
    let going = false;
    let stand = false;

    let changeEnd = Date.now();
    let lastRing = Date.now();
    let place = 0;
    let stroke = c.HAND;
    let iAmRinging = [];

    let methodRows = []
    let currentRow = []

    function onKeyDown(e) {
        if (e.key == "l") {
            // Take my bells, setup
            numberOfbells = getNumberOfBells();
            let changeTime = simulatorInterface.getPeelSpeed() / 5000 /* hours per row */ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /* miliseconds */;
            bellInterval = changeTime / numberOfbells;
            gracePeriod = bellInterval * 2 / 3
            stroke = c.HAND;
            place = 0;
            going = false;

            currentRow = methodRows[0];
            // starting at 0 will result in the first row being rung twice. 
            rowNumber = 0
            
            if (simulatorInterface.getTakeBellsMode() == c.REMAINING_BELLS) {
                iAmRinging = getUnassignedBells();
            } else if (simulatorInterface.getTakeBellsMode() == c.ALL_BELLS) {
                iAmRinging = [...Array(numberOfbells + 1).keys()].filter(i => i != 0);
            } else if (simulatorInterface.getTakeBellsMode() == c.NO_BELLS) {
                iAmRinging = [];
            }

            if (simulatorInterface.getTakeBellsMode() != c.NO_BELLS) {
                setTimeout(function () {
                    changeEnd = Date.now();
                    ringNext()
                }, 2000);
            }
        }

        if(e.key == "g") {
            going = true;
        }

        if(e.key == "h") {
            going = false;
        }

        if (e.key == "t") {
            stand = true;
        }
    }

    function ringBell(number) {
        let key = number
        if (number == 10) {
            key = 0
        } else if (number == 11) {
            key = "-"
        } else if (number == 12) {
            key = "="
        }
        window.dispatchEvent(new KeyboardEvent('keydown', { 'key': "" + key }));
        log("pressed " + number)

        window.dispatchEvent(new KeyboardEvent('keyup', { 'key': "" + key }));
        log("released " + number)
    }

    function ringNext() {
        let currentBell = currentRow[place];
        // pause for one best after the end of the last change, if it's a c.HANDstroke, pause for two beats for c.HANDstroke gap. 
        let waitTime;
        if(simulatorInterface.getRingMode() == c.RING_STEADY) {
            waitTime = (bellInterval * (place + (stroke == c.HAND ? 2 : 1))) - (Date.now() - changeEnd);
        }  else if(simulatorInterface.getRingMode() == c.WAIT_FOR_HUMANS) {
            waitTime = bellInterval - (Date.now() - lastRing);
        }
        if (waitTime <= 0) {
            if (iAmRinging.includes(currentBell)) {

                // If it's the simulator, go for it.
                ringBell(currentBell)
            } else {
                // Check if we need to wait
                let state = getState();
                let lastBellHasRung = (stroke == c.HAND && state[currentBell] != c.HAND) || (stroke == c.BACK && state[currentBell] != c.BACK)
                if (!lastBellHasRung) {
                    if(simulatorInterface.getRingMode() == c.RING_STEADY) {
                        if (waitTime + gracePeriod > 0) {
                            // We still have grace period. Hesitate.
                            setTimeout(function () { ringNext() }, waitTime + gracePeriod / 10);
                            // Prevent moving on
                            return;
                        }
                    } else if(simulatorInterface.getRingMode() == c.WAIT_FOR_HUMANS && !stand) {
                        // so long as we aren't standing, start polling, otherwise carry on
                        setTimeout(function () { ringNext() }, bellInterval / 30);
                        // Prevent moving on
                        return;
                    }
                } // else last bell rang, carry on.
            }

            lastRing = Date.now();
            place++
            if (place >= numberOfbells) {
                if (stand && stroke == c.BACK) {
                    stand = false;
                    return;
                }

                nextChange()
            }

            // Run the loop again to trigger the appropriate wait.
            ringNext();
        } else {
            setTimeout(function () { ringNext() }, waitTime);
        }
    }

    function nextChange() {
        if(rowNumber >= methodRows.length) {
            // remember that the last row is the first row, 
            // so if just rang the last row, don't ring that row again 
            rowNumber = 1;
        }

        if(!going || (rowNumber == 1 && stroke == c.HAND)) {
            // if not going, reset to the first row
            // or if we are going, don't go to the first row until we've just finished a backstroke.
            rowNumber = 0;
        } 
        if(rowNumber < 0 || rowNumber >= methodRows.length) console.error("Impossible state! rowNumber="+rowNumber)
        currentRow = methodRows[rowNumber];
        rowNumber++;

        if (stroke == c.HAND) {
            stroke = c.BACK;
        } else {
            stroke = c.HAND;
        }
        changeEnd = Date.now()
        place = 0;
    }

    function getUnassignedBells() {
        let bells = []
        $(".bell").each(function (index, bell) {
            bell = $(bell)
            if (bell.find(".btn-group").children().length == 2) {
                // Bell is assigned to a user
                log("Bell " + bell.attr('id') + " taken.")
            } else if (bell.find(".btn-group").children().length == 1) {
                // Bell is unassigned
                bells.push(parseInt(bell.attr('id')))
            } else {
                console.error("Interface changed and this extention is out of sync or something glitched!")
            }
        })
        return bells;
    }
    
    function getNumberOfBells() {
        return $(".bell_img").length;
    }

    function getState() {
        state = []
        $(".bell").each(function (index, bell) {
            let bellNumber = parseInt($(bell).attr('id'))
            let isHand = $(bell).find(".bell_img").attr("src").includes("c.HANDstroke")
            state[bellNumber] = isHand ? c.HAND : c.BACK;
        })

        return state;
    }

    window.addEventListener('keydown', onKeyDown);
    simulatorInterface.buildInterface();
    simulatorInterface.setPlaceNotationChangeCallback((currentNotation) => {
        let result = placeNotationToRowArray(currentNotation, getNumberOfBells());
        if (result.success) {
            simulatorInterface.setNotationValid(true);
            methodRows = result.result;
        } else {
            simulatorInterface.setNotationValid(false);
        }
    })
})();