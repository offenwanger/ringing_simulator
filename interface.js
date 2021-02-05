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

    let peelSpeedInHours = 3.5;
    
    function buildInterface(methodSet) {
        let FAB = createFAB();
        let interface = createInterface(FAB, methodSet);
    
        $("body").append(FAB)
        $("body").append(interface)
    }

    function createFAB() {
        let FAB = $("<div>").attr("id", "simulator-toggle").css("position", "absolute").css("bottom", "5%").css("right", "5%").css("z-index", 5);
        let image = $("<img>").attr("src", chrome.extension.getURL('icon.svg')).attr("width", "50px").attr("height", "50px");
        FAB.append(image)
        return FAB;
    }

    function isActive() {
        return $("#simulator-toggle").hasClass("simulator-active");
    }

    function createInterface(openToggle, methodSet) {
        let interface = $("<div>").attr("class", "dialog").attr("id","simulator-interface").css("z-index", 6);

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

        let peelSpeedHoursInput = $("<input>").attr("type", "number").attr("min", 1).attr("style", "width:50px");
        let peelSpeedMinutesInput = $("<input>").attr("type", "number").attr("min", -1).attr("max", 60).attr("style", "width:50px");
        peelSpeedHoursInput.val(Math.floor(peelSpeedInHours))
        peelSpeedMinutesInput.val(Math.round((peelSpeedInHours * 60) % 60))
        let onPeelSpeechChange = function () { peelSpeedInHours = parseInt(peelSpeedHoursInput.val()) + (parseInt(peelSpeedMinutesInput.val()) / 60); };
        peelSpeedHoursInput.on("change", onPeelSpeechChange)
        peelSpeedMinutesInput.on('input', function() {
            if(peelSpeedMinutesInput.val() < 0) {
                peelSpeedMinutesInput.val(59)
            } else if (peelSpeedMinutesInput.val() > 59) {
                peelSpeedMinutesInput.val(0)
            }
            
            onPeelSpeechChange();
        });
    
        interface.append($("<span>").html("Peel Speed"));
        interface.append($("<br>"));
        interface.append($("<span>").html("Hours: "));
        interface.append(peelSpeedHoursInput);
        interface.append($("<br>"))
        interface.append($("<span>").html("Minutes: "));
        interface.append(peelSpeedMinutesInput);
        interface.append($("<br>"))
        interface.append($("<br>"))

        let methodSelect = $("<select>").css("width", "170px");
        methodSelect.append($("<option>").attr("value", "select").html("&lt;select method&gt;"));
        methodSet.forEach(method => {
            methodSelect.append($("<option>").attr("value", method.placeNotation).html(method.name));
        });
        methodSelect.append($("<option>").attr("value", "input").html("&lt;input place notation&gt;"));
        interface.append(methodSelect)

        let placeNotationInput = $("<div>");
        
        let placeNotationTextInput = $("<input>")
            .attr("type", "text")
            .attr("id","place-notation-input")
            .attr("placeholder","place notation")
            .attr("width", "75px");
        placeNotationInput.append(placeNotationTextInput);

        let placeNotationDoneButton = $("<button>").html("Done").on("click", function () { 
            if(placeNotationCallback) {
                placeNotationCallback(placeNotationTextInput.val());
            }
        });
        placeNotationInput.append(placeNotationDoneButton);

        interface.append(placeNotationInput);
        placeNotationInput.hide();

        methodSelect.on("change", function () {
            placeNotationInput.hide();
            placeNotationTextInput.val("");
            $("#simulator-place-notation-status").hide();
            
            let newPlaceNotation = this.value;
            if(newPlaceNotation == "select") {
                placeNotationCallback("");
            } else if(newPlaceNotation == "input") {
                placeNotationInput.show();
                placeNotationCallback("");
            } else {
                placeNotationCallback(newPlaceNotation);
            }
        });

        interface.append($("<br>"));

        let statusMessage = $("<div>").attr("id", "simulator-place-notation-status");
        interface.append(statusMessage);
        statusMessage.hide();

        interface.append($("<br>"));

        interface.append($("<strong>").html("Current Row"));
        interface.append($("<div>").attr("id", "simulator-current-row-display").html("-"));
        interface.append($("<strong>").html("Next Rows"));
        interface.append($("<div>").attr("id", "simulator-second-row-display").html("-"));
        interface.append($("<div>").attr("id", "simulator-third-row-display").html("-"));
        interface.append($("<div>").attr("id", "simulator-fouth-row-display").html("-"));

        openToggle.on("click", function () {
            interface.show();
            // If the simulator was downsized, this will call again, but that's fine since it
            // doesn't double add.
            openToggle.addClass("simulator-active");
        });

        let topButtonDiv = $("<div>").attr("class", "exit-downsize-button-div");

        let downsizeButton = $("<button>").html("-").on("click", function () { 
            interface.hide();
        })
        topButtonDiv.append(downsizeButton);

        let exitButton = $("<button>").html("X").on("click", function () { 
            openToggle.removeClass("simulator-active");
            interface.hide();
            if(stopCallback) {
                stopCallback();
            } 
        })
        topButtonDiv.append(exitButton);    

        interface.append(topButtonDiv);

        interface.hide();
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

    function setNotationValid(valid, error) {
        if(valid) { 
            $("#simulator-place-notation-status").html("Ready");
            $("#simulator-place-notation-status").show();
        } else if(error) {
            $("#simulator-place-notation-status").html("Error: " + error);
            $("#simulator-place-notation-status").show();
        } else {
            $("#simulator-place-notation-status").hide();
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
        getPeelSpeed:()=>peelSpeedInHours
    }
})();