
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

    let ringLoop;

    function onKeyDown(e) {
        if (e.key == "l") {            
            if(simulatorInterface.isActive()) {
                // Take my bells, setup
                numberOfbells = getNumberOfBells();
                let changeTime = simulatorInterface.getPeelSpeed() / 5000 /* hours per row */ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /* miliseconds */;
                bellInterval = changeTime / numberOfbells;
                gracePeriod = bellInterval * 2 / 3
                stroke = c.HAND;
                place = 0;
                going = false;
                stand = false;

                currentRow = methodRows[0];
                rowNumber = 0

                iAmRinging = getUnassignedBells();
                ringLoop = setTimeout(function () {
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
                            ringLoop = setTimeout(function () { ringNext() }, waitTime + gracePeriod / 10);
                            // Prevent moving on
                            return;
                        }
                    } else if(simulatorInterface.getRingMode() == c.WAIT_FOR_HUMANS && !stand) {
                        // so long as we aren't standing, start polling, otherwise carry on
                        ringLoop = setTimeout(function () { ringNext() }, bellInterval / 30);
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
            ringLoop = setTimeout(function () { ringNext() }, waitTime);
        }
    }

    function nextChange() {
        rowNumber = getNextRowNumber(rowNumber, methodRows.length, stroke, simulatorInterface.getGoMode(), going);

        // reverse the stroke 
        if (stroke == c.HAND) {
            stroke = c.BACK;
        } else {
            stroke = c.HAND;
        }
        
        currentRow = methodRows[rowNumber];
        changeEnd = Date.now()
        place = 0;
    }

    function getNextRowNumber(currentRowNumber, methodLength, currStroke, currGoMode, isGoing) {                
        if(currGoMode == c.FOLLOW_COMMANDS && !isGoing) {
            // if we're following go commands and not going, ring rounds
            return 0;
        } else if(currentRowNumber == 0 && currStroke == c.HAND) {
            // if we just rang row 0 on a hand
            // do nothing to ring row 0 again because we need to start on a hand stroke
            return 0;
        } else if(currentRowNumber == 0 && currStroke == c.BACK) {
            // If we're on row 0, just finished a back, either up_down_go, or have had the go command, off we go
            return 1;
            // Note: this case not strictly nessisary, but makes for easier to follow flow
        } else if(currentRowNumber >= methodLength - 1) {
            // if we've reached the end of the method, check what to do:
            if(currGoMode == c.FOLLOW_COMMANDS) {
                // we're still going because that would have been caught above
                // start at 1 because 0 is rounds again, and we should have just rang that
                return 1;
            } else if(currGoMode == c.UP_DOWN_GO) {
                // stay at current row number and just keep ringing it over and over.
                return currentRowNumber;
            } else {
                console.error("Invalid inputs!", currentRowNumber, methodLength, currStroke, currGoMode, isGoing);
                return null;
            }
        } else {
            // Carry on.
            return currentRowNumber + 1;
        }
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
    });

    simulatorInterface.setStopCallback(() => {
        stand = true;
        clearTimeout(ringLoop);
        ringLoop = null;
    });
})();