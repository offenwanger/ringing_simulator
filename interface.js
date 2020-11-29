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
        goModeSelector.append($("<option>").attr("value", c.UP_DOWN_GO).html("Up, down, go"));
        goModeSelector.append($("<option>").attr("value", c.FOLLOW_COMMANDS).html("Wait for go / that's all"));
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
        interface.append($("<br>"));
        interface.append($("<br>"));

        interface.append($("<strong>").html("Current Row"));
        interface.append($("<div>").attr("id", "simulator-current-row-display").html("-"));
        interface.append($("<strong>").html("Next Rows"));
        interface.append($("<div>").attr("id", "simulator-second-row-display").html("-"));
        interface.append($("<div>").attr("id", "simulator-third-row-display").html("-"));
        interface.append($("<div>").attr("id", "simulator-fouth-row-display").html("-"));

        let exitButton = $("<button>").html("X").attr("class", "exit-button").on("click", function () { 
            interface.hide();
            if(stopCallback) {
                stopCallback();
            } 
        })
        interface.append(exitButton);

        return interface
    }

    function setFutureRowsDisplay(secondRow, thirdRow, fourthRow) {
        replaceRowSpans(secondRow, $("#simulator-second-row-display"));
        replaceRowSpans(thirdRow, $("#simulator-third-row-display"));
        replaceRowSpans(fourthRow, $("#simulator-fouth-row-display"));
    }

    function setCurrentRowDisplay(currentRow, lastRungPlace, stroke, state) {
        replaceRowSpans(currentRow, $("#simulator-current-row-display"));
        if(!currentRow || currentRow.length == 0) {
            return;
        }
        
        for(let i=0;i<currentRow.length;i++) { 
            let span = $("#simulator-current-row-display").find(".simulator-bell-"+currentRow[i]).first();
            let hasGone = i < lastRungPlace;
            let shouldBe = !hasGone ? stroke : (stroke == c.HAND?c.BACK:c.HAND);
            let bell = currentRow[i];
            if(state[bell] != shouldBe) {
                span.removeClass("valid");
                span.addClass("invalid");
            } else {
                span.removeClass("invalid");
                if(i <= lastRungPlace) span.addClass("valid");
            }
        }
    }

    function replaceRowSpans(row, parent) {
        parent.empty();
        if(!row) {
            parent.append($("<span>").html("-"));
        } else {
            for(let i=0;i<row.length;i++) {
                let bell = row[i]
                if(row[i] == 10) {
                    bell = 0;
                } else if(bell == 11) {
                    bell = "E"
                } else if(bell == 12) {
                    bell = "T"
                }
                parent.append($("<span>").addClass("simulator-bell-row-display").addClass("simulator-bell-"+ row[i]).html(bell));
            }
        }
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
        setFutureRowsDisplay:setFutureRowsDisplay,
        setCurrentRowDisplay:setCurrentRowDisplay,
        getRingMode:()=>ringMode,
        getGoMode:()=>goMode,
        getPeelSpeed:()=>peelSpeedInHours,
        getCurrentNotation:()=>$("#place-notation-input").val(),
    }
})();