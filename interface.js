let simluatorInterface = (function () {
    let c = simulatorConstants;
    const DEBUG = true
    function log(str) {
        if (DEBUG) console.log(str)
    }

    let takeBellsMode = c.REMAINING_BELLS;
    let ringMode = c.RING_STEADY;
    let methodMode = -1

    let methodRows = []

    let peelSpeedInHours = 4;
    
    function buildInterface() {
        let FAB = createFAB();
        let interface = createInterface();
    
        interface.hide();
        FAB.on("click", function () {
            interface.show();
        });
    
        $("body").append(FAB)
        $("body").append(interface)
    }

    function createFAB() {
        let FAB = $("<div>").attr("style", "position: fixed; bottom: 5%; right: 5%");
        let image = $("<img>").attr("src", chrome.extension.getURL('icon.svg')).attr("width", "50px").attr("height", "50px");
        FAB.append(image)
        return FAB;
    }

    function getNumberOfBells() {
        return $(".bell_img").length;
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
        modeSelector.append($("<option>").attr("value", c.REMAINING_BELLS).html("Ring Remaining Bells"));
        modeSelector.append($("<option>").attr("value", c.ALL_BELLS).html("Ring All Bells"));
        modeSelector.append($("<option>").attr("value", c.NO_BELLS).html("Ring No Bells"));
        modeSelector.on("change", function () {
            takeBellsMode = this.value
        })
        modeSelector.val(takeBellsMode);
        content.append(modeSelector);
        content.append($("<br>"))

        let ringModeSelector = $("<select>");
        ringModeSelector.append($("<option>").attr("value", c.RING_STEADY).html("Ring Steady"));
        ringModeSelector.append($("<option>").attr("value", c.WAIT_FOR_HUMANS).html("Wait For Other Bells"));
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
        methodSelector.append($("<option>").attr("value", c.SINGLE_ROW).html("Single Row"));
        methodSelector.append($("<option>").attr("value", c.INPUT_PLACE_NOTATION).html("Input Place Notation"));
        methodSelector.on("change", function () {
            methodMode = parseInt(this.value);
            methodInput.empty();

            if (methodMode == c.INPUT_PLACE_NOTATION) {
                let rowInput = $("<input>").attr("type", "text")
                rowInput.on("change", function () {
                    let result = placeNotationToRowArray(this.value, getNumberOfBells());
                    if (result.success) {
                        rowInput.attr("style", "c.BACKground:green")
                        methodRows = result.result;
                    } else {
                        rowInput.attr("style", "")
                    }
                })
                methodInput.append(rowInput);

            } else if (methodMode == c.SINGLE_ROW) {
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
                        rowInput.attr("style", "c.BACKground:green")
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

    return {
        buildInterface:buildInterface,
        getNumberOfBells:getNumberOfBells,
        getRingMode:()=>ringMode,
        getTakeBellsMode:()=>takeBellsMode,
        getMethodMode:()=>methodMode,
        getMethodRows:()=>methodRows,
        getPeelSpeed:()=>peelSpeedInHours,
    }
})();