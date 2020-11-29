let simluatorInterface = (function () {
    let c = simulatorConstants;
    const DEBUG = true
    function log(str) {
        if (DEBUG) console.log(str)
    }

    let takeBellsMode = c.REMAINING_BELLS;
    let ringMode = c.WAIT_FOR_HUMANS;

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

    function getMethodRows() {
        if(!methodRows || methodRows.length == 0) {
            return getRoundsRowArray(getNumberOfBells);
        } else {
            return methodRows;
        }
    }

    function createInterface() {
        let interface = $("<div>").attr("class", "dialog");

        let header = $("<h3>").html("Ringing Simulator");
        interface.append(header);

        let modeSelector = $("<select>");
        modeSelector.append($("<option>").attr("value", c.REMAINING_BELLS).html("Ring Remaining Bells"));
        modeSelector.append($("<option>").attr("value", c.ALL_BELLS).html("Ring All Bells"));
        modeSelector.append($("<option>").attr("value", c.NO_BELLS).html("Ring No Bells"));
        modeSelector.on("change", function () {
            takeBellsMode = this.value
        })
        modeSelector.val(takeBellsMode);
        interface.append(modeSelector);
        interface.append($("<br>"))

        let ringModeSelector = $("<select>");
        ringModeSelector.append($("<option>").attr("value", c.RING_STEADY).html("Ring Steady"));
        ringModeSelector.append($("<option>").attr("value", c.WAIT_FOR_HUMANS).html("Wait For Other Bells"));
        ringModeSelector.on("change", function () {
            ringMode = this.value
        })
        ringModeSelector.val(ringMode);
        interface.append(ringModeSelector);
        interface.append($("<br>"))
        interface.append($("<br>"))

        let peelSpeedHoursInput = $("<input>").attr("type", "number").attr("min", 0).attr("style", "width:40px");
        let peelSpeedMinutesInput = $("<input>").attr("type", "number").attr("min", 0).attr("max", 59).attr("style", "width:75px");
        peelSpeedHoursInput.val(Math.round(peelSpeedInHours))
        peelSpeedMinutesInput.val(Math.round((peelSpeedInHours * 60) % 60))
        let onPeelSpeechChange = function () { peelSpeedInHours = parseInt(peelSpeedHoursInput.val()) + (parseInt(peelSpeedMinutesInput.val()) / 60); };
        peelSpeedHoursInput.on("change", onPeelSpeechChange)
        peelSpeedMinutesInput.on("change", onPeelSpeechChange)
        interface.append($("<span>").html("Peel Speed "));
        interface.append(peelSpeedHoursInput);
        interface.append($("<span>").html(" hours "));
        interface.append(peelSpeedMinutesInput);
        interface.append($("<span>").html(" minutes."));
        interface.append($("<br>"))
        interface.append($("<br>"))

        let rowInput = $("<input>")
            .attr("type", "text")
            .attr("id","place-notation-input")
            .attr("placeholder","place notation");
        rowInput.on("change", function () {
            let result = placeNotationToRowArray(this.value, getNumberOfBells());
            if (result.success) {
                rowInput.attr("style", "background:green")
                methodRows = result.result;
            } else {
                rowInput.attr("style", "")
            }
        })
        interface.append(rowInput);

        let exitButton = $("<button>").html("X").attr("class", "exit-button").on("click", function () { interface.hide(); })
        interface.append(exitButton);

        return interface
    }

    return {
        buildInterface:buildInterface,
        getNumberOfBells:getNumberOfBells,
        getMethodRows:getMethodRows,
        getRingMode:()=>ringMode,
        getTakeBellsMode:()=>takeBellsMode,
        getPeelSpeed:()=>peelSpeedInHours,
    }
})();