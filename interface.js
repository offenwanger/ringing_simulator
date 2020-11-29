let simulatorInterface = (function () {
    let c = simulatorConstants;
    const DEBUG = true
    function log(str) {
        if (DEBUG) console.log(str)
    }

    let ringMode = c.WAIT_FOR_HUMANS;
    let goMode = c.UP_DOWN_GO;

    let placeNotationCallback;
    let stopCallback;

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

    function isActive() {
        return $("#simulator-interface").is(":visible");
    }

    function createInterface() {
        let interface = $("<div>").attr("class", "dialog").attr("id","simulator-interface");

        let header = $("<h3>").html("Ringing Simulator");
        interface.append(header);

        let ringModeSelector = $("<select>");
        ringModeSelector.append($("<option>").attr("value", c.RING_STEADY).html("Ring Steady"));
        ringModeSelector.append($("<option>").attr("value", c.WAIT_FOR_HUMANS).html("Wait For Other Bells"));
        ringModeSelector.on("change", function () {
            ringMode = this.value
        })
        ringModeSelector.val(ringMode);
        interface.append(ringModeSelector);
        interface.append($("<br>"))

        let goModeSelector = $("<select>");
        goModeSelector.append($("<option>").attr("value", c.UP_DOWN_GO).html("Up, Down, Go"));
        goModeSelector.append($("<option>").attr("value", c.GO_THATS_ALL).html("Wait for go / that's all"));
        goModeSelector.on("change", function () {
            goMode = this.value
        })
        goModeSelector.val(goMode);
        interface.append(goModeSelector);
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
            if(placeNotationCallback) {
                placeNotationCallback(this.value);
            }
        })
        interface.append(rowInput);

        let exitButton = $("<button>").html("X").attr("class", "exit-button").on("click", function () { 
            interface.hide();
            if(stopCallback) {
                stopCallback();
            } 
        })
        interface.append(exitButton);

        return interface
    }

    function setNotationValid(valid) {
        if(valid) {
            $("#place-notation-input").addClass("valid")
        } else {
            $("#place-notation-input").removeClass("valid")
        }
    }

    return {
        buildInterface:buildInterface,
        isActive:isActive,
        setPlaceNotationChangeCallback:(callback) => placeNotationCallback = callback,
        setStopCallback:(callback) => stopCallback = callback,
        setNotationValid:setNotationValid,
        getRingMode:()=>ringMode,
        getGoMode:()=>goMode,
        getPeelSpeed:()=>peelSpeedInHours,
    }
})();