
(function () {
    const DEBUG = true
    function log(str) {
        if (DEBUG) console.log(str)
    }

    const NO_BELLS = 0;
    const ALL_BELLS = 1;
    const REMAINING_BELLS = 2;
    let mode = REMAINING_BELLS;

    const SINGLE_ROW = 0;
    const INPUT_PLACE_NOTATION = 1;
    let methodMode = -1
    let methodRows = []
    let rowNumber = 0

    const HAND = true;
    const BACK = false;

    let peelSpeedInHours = 4;
    let bellInterval = -1;
    let gracePeriod = -1;

    let numberOfbells = -1;
    let stand = false;


    const WAIT_FOR_HUMANS = 0;
    const RING_STEADY = 1;
    let ringMode = RING_STEADY;

    let changeEnd = Date.now();
    let lastRing = Date.now();
    let place = 0;
    let stroke = HAND;
    let iAmRinging = [];

    let currentRow = []

    function onKeyDown(e) {
        if (e.key == "l") {
            // Take my bells, setup
            numberOfbells = getNumberOfBells();
            let changeTime = peelSpeedInHours / 5000 /* hours per row */ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /* miliseconds */;
            bellInterval = changeTime / numberOfbells;
            gracePeriod = bellInterval * 2 / 3
            stroke = HAND;
            place = 0;

            if (methodMode == SINGLE_ROW) {
                currentRow = methodRows[0];
            } else if (INPUT_PLACE_NOTATION) {
                currentRow = methodRows[0];
                // starting at 0 will result in the first row being rung twice. 
                rowNumber = 0
            }

            if (mode == REMAINING_BELLS) {
                iAmRinging = getUnassignedBells();
            } else if (mode == ALL_BELLS) {
                iAmRinging = [...Array(numberOfbells + 1).keys()].filter(i => i != 0);
            } else if (mode == NO_BELLS) {
                iAmRinging = [];
            }

            if (mode != NO_BELLS) {
                setTimeout(function () {
                    changeEnd = Date.now();
                    ringNext()
                }, 2000);
            }
        }

        if (e.key == "t") {
            stand = true
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
        // pause for one best after the end of the last change, if it's a handstroke, pause for two beats for handstroke gap. 
        let waitTime;
        if(ringMode == RING_STEADY) {
            waitTime = (bellInterval * (place + (stroke == HAND ? 2 : 1))) - (Date.now() - changeEnd);
        }  else if(ringMode == WAIT_FOR_HUMANS) {
            waitTime = bellInterval - (Date.now() - lastRing);
        }
        if (waitTime <= 0) {
            if (iAmRinging.includes(currentBell)) {

                // If it's the simulator, go for it.
                ringBell(currentBell)
            } else {
                // Check if we need to wait
                let state = getState();
                let lastBellHasRung = (stroke == HAND && state[currentBell] != HAND) || (stroke == BACK && state[currentBell] != BACK)
                if (!lastBellHasRung) {
                    if(ringMode == RING_STEADY) {
                        if (waitTime + gracePeriod > 0) {
                            // We still have grace period. Hesitate.
                            setTimeout(function () { ringNext() }, waitTime + gracePeriod / 10);
                            // Prevent moving on
                            return;
                        }
                    } else if(ringMode == WAIT_FOR_HUMANS) {
                        // check again every 10th of a ring
                        setTimeout(function () { ringNext() }, bellInterval / 10);
                        // Prevent moving on
                        return;
                    }
                } // else last bell rang, carry on.
            }

            lastRing = Date.now();
            place++
            if (place >= numberOfbells) {
                if (stand && stroke == BACK) {
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
        if (methodMode == SINGLE_ROW) {
            currentRow = methodRows[0];
        } else if (INPUT_PLACE_NOTATION) {
            currentRow = methodRows[Math.min(Math.max(0, rowNumber), methodRows.length - 1)];
            rowNumber++;
        }

        if (stroke == HAND) {
            stroke = BACK;
        } else {
            stroke = HAND;
        }
        changeEnd = Date.now()
        place = 0;
    }

    function getNumberOfBells() {
        return $(".bell_img").length;
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

    function getState() {
        state = []
        $(".bell").each(function (index, bell) {
            let bellNumber = parseInt($(bell).attr('id'))
            let isHand = $(bell).find(".bell_img").attr("src").includes("handstroke")
            state[bellNumber] = isHand ? HAND : BACK;
        })

        return state;
    }

    function createFAB() {
        let FAB = $("<div>").attr("style", "position: fixed; bottom: 5%; right: 5%");
        let image = $("<img>").attr("src", chrome.extension.getURL('icon.svg')).attr("width", "50px").attr("height", "50px");
        FAB.append(image)
        return FAB;
    }

    function createInterface() {
        let interface = $("<div>").attr("class", "dialog").attr("id", "simulator-interface");
        interface.on("click", function (e) {
            if ($(e.target).attr("id") == interface.attr("id")) {
                interface.hide()
            }
        });

        let content = $("<div>").attr("class", "dialog-content");
        interface.append(content);

        let header = $("<h3>").html("Ringing Simulator");
        content.append(header);

        let modeSelector = $("<select>");
        modeSelector.append($("<option>").attr("value", REMAINING_BELLS).html("Ring Remaining Bells"));
        modeSelector.append($("<option>").attr("value", ALL_BELLS).html("Ring All Bells"));
        modeSelector.append($("<option>").attr("value", NO_BELLS).html("Ring No Bells"));
        modeSelector.on("change", function () {
            mode = this.value
        })
        modeSelector.val(mode);
        content.append(modeSelector);
        content.append($("<br>"))

        let ringModeSelector = $("<select>");
        ringModeSelector.append($("<option>").attr("value", RING_STEADY).html("Ring Steady"));
        ringModeSelector.append($("<option>").attr("value", WAIT_FOR_HUMANS).html("Wait For Other Bells"));
        ringModeSelector.on("change", function () {
            ringMode = this.value
        })
        ringModeSelector.val(ringMode);
        content.append(ringModeSelector);
        content.append($("<br>"))

        let peelSpeedHoursInput = $("<input>").attr("type", "number").attr("min", 0).attr("style", "width:40px");
        let peelSpeedMinutesInput = $("<input>").attr("type", "number").attr("min", 0).attr("max", 59).attr("style", "width:75px");
        peelSpeedHoursInput.val(Math.round(peelSpeedInHours))
        peelSpeedMinutesInput.val(Math.round((peelSpeedInHours * 60) % 60))
        let onPeelSpeechChange = function () { peelSpeedInHours = parseInt(peelSpeedHoursInput.val()) + (parseInt(peelSpeedMinutesInput.val()) / 60); };
        peelSpeedHoursInput.on("change", onPeelSpeechChange)
        peelSpeedMinutesInput.on("change", onPeelSpeechChange)
        content.append($("<span>").html("Peel Speed "));
        content.append(peelSpeedHoursInput);
        content.append($("<span>").html(" hours "));
        content.append(peelSpeedMinutesInput);
        content.append($("<span>").html(" minutes."));
        content.append($("<br>"))

        let methodSelector = $("<select>");
        methodSelector.append($("<option>").attr("value", -1).html("&lt;select&gt"));
        methodSelector.append($("<option>").attr("value", SINGLE_ROW).html("Single Row"));
        methodSelector.append($("<option>").attr("value", INPUT_PLACE_NOTATION).html("Input Place Notation"));
        methodSelector.on("change", function () {
            methodMode = parseInt(this.value);
            methodInput.empty();

            if (methodMode == INPUT_PLACE_NOTATION) {
                let rowInput = $("<input>").attr("type", "text")
                rowInput.on("change", function () {
                    let result = placeNotationToRowArray(this.value, getNumberOfBells());
                    if (result.success) {
                        rowInput.attr("style", "background:green")
                        methodRows = result.result;
                    } else {
                        rowInput.attr("style", "")
                    }
                })
                methodInput.append(rowInput);

            } else if (methodMode == SINGLE_ROW) {
                let rowInput = $("<input>").attr("type", "text")
                rowInput.on("change", function () {
                    let valid = true;
                    methodRows = [[]];
                    let result = this.value.split(",");
                    for (let i = 0; i < result.length; i++) {
                        let num = parseInt(result[i]);
                        if (isNaN(num)) {
                            if (result[i] == "E") {
                                methodRows[0].push(11);
                            } else if (result[i] == "T") {
                                methodRows[0].push(12);
                            } else {
                                console.error("Invalid place notation: " + result[i])
                                valid = false;
                            }
                        } else if (num == 0) {
                            methodRows[0].push(10)
                        } else if (num <= 9 && num > 0) {
                            methodRows[0].push(num)
                        } else {
                            console.error("Invalid place notation: " + result[i])
                            valid = false;
                        }
                    }
                    if (valid) {
                        rowInput.attr("style", "background:green")
                    } else {
                        rowInput.attr("style", "")
                    }
                })
                methodInput.append(rowInput);

                methodInput.show();
            } else {
                methodInput.hide();
                methodInput.empty();
            }

        })
        content.append(methodSelector);
        content.append($("<br>"))

        let methodInput = $("<div>");
        content.append(methodInput);
        content.append($("<br>"))
        content.append($("<br>"))

        let doneButton = $("<button>").html("Done").on("click", function () { interface.hide(); })
        content.append(doneButton);

        return interface
    }

    function getMethods() {
        console.log("making methods request");
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://vivacious-port.glitch.me/find/methods',
                type: 'GET',
                success: function (data) {
                    resolve(data);
                },
                error: function (data) {
                    reject(data);
                }
            });
        });
    }

    window.addEventListener('keydown', onKeyDown);

    let FAB = createFAB();
    let interface = createInterface();

    interface.hide();
    FAB.on("click", function () {
        interface.show();
    });

    $("body").append(FAB)
    $("body").append(interface)

})();