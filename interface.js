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

    let pealSpeedInHours = 3.5;
    
    function buildInterface(methodSet) {
        let FAB = createFAB();
        let helpMenu = createHelpMenu();
        let interface = createInterface(FAB, methodSet, helpMenu);
    
        $("body").append(FAB)
        $("body").append(helpMenu)
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

    function createHelpMenu() {
        let menu = $("<div>")
            .addClass("overlay-popup")
            .on("click", function(e) {
                if(e.target == this) {
                    menu.hide();
                }
            });
        
        let content = $("<div>")
            .addClass("overlay-popup-content");
        menu.append(content); 

        let header = $("<h3>")
            .html("Ringing Simulator Overview")
            .css("float", "left");
        content.append(header);

        let exitButton = $("<button>")
            .html("X")
            .css("float", "right")
            .on("click", function () { 
                menu.hide();
            });
        content.append(exitButton); 
        
        content.append($("<br>"));
        content.append($("<br>"));

        content.append($("<div>").html(`Thank you for using this Ringing Simulator! This overview outlines all the main functionality of the simulator.`));
        content.append($("<br>"));

        content.append($("<h4>").html("Controlling  the Simulator"));
        content.append($("<div>").html(`When the simulator panel is open, the simulator is active. Clicking the 'X' in the top right corner will 
            turn off the simulator. Clicking the '-' in the top right corner will close the panel, but leave the simulator active. When the simulator is active, it will 
            listen to commands <strong>from the person who has it installed</strong>. If two people have the simulator installed, each simulator will only listen to "Look To" 
            commands from the person who has it installed, not any of the other ringers. 
            If the simulator has a method set and is ready to ring, the simulator will ring all unassigned bells when the person who has it installed gives the 
            "Look to" command ('L' button), and stop when the "Stand" command is given ("T" button). See below for more information on setting a method.`));
        content.append($("<br>"));

        content.append($("<div>").html(`Please Note: The simulator cannot ring in Host Mode. If you have Host Mode enabled in the tower, ensure that it is set to off.
            (If you don't know what Host Mode is, then it's probably already off)`));
        
        content.append($("<br>"));
        

        content.append($("<h4>").html("Simulator Settings"));
        content.append($("<h5>").html("Pacing"));
        content.append($("<div>").html(`The options for simulator pacing are "Wait for Other Bells" and "Ring Steady". 
        <br>    
        When set for "Wait for Other Bells" the simulator will hold up over other bells indefinitely. 
        <br>
        When set for "Ring Steady" the simulator will ignore the other ringers and ring steadily at the set peal speed.`));
        content.append($("<br>"));

        content.append($("<h5>").html("'Look To'/'Go' Behavior"));
        content.append($("<div>").html(`The simulator has two different modes when it comes to start and stop commands, "Up, Down, Go" and "Wait for go / That's all". 
            <br>
            In "Up, Down, Go" mode, the simulator will wait for the "Look To" command, ring up and down in rounds then start off into the selected method, 
            and return to rounds at the end of the method, ringing until "Stand" is called.
            <br>
            In "Wait for go / That's all" mode, the simulator will wait for the "Look To" command, and will ring in rounds until the "Go" command, then it will ring the 
            method until "That's All" or "Stand" is called.
            The simulator does not yet handle Bob and Single commands.`));
        content.append($("<br>"));
            
        content.append($("<h5>").html("Peal Speed"));
        content.append($("<div>").html(`The peal speed is set in hours and minutes. Peal speed cannot be less than 1 hour.`));
        content.append($("<br>"));

        content.append($("<h4>").html("Select Method"));
        content.append($("<div>").html(`The simulator comes with a selection of methods available in a dropdown menu. Clicking on the drop down and clicking on the desired method 
            will set the method, and the first couple lines of the method should appear in the preview. The simulator should indicate that it is ready to ring.
            <br>
            If the method you want to ring is not in the menu, it can be entered via place notation by selecting the last option in the menu, &lt;input place notation&gt;. Place notation for most methods can be found by searching 
            <a href="http://methods.ringing.org/" target="_blank">http://methods.ringing.org/</a>.`));
        content.append($("<br>"));

            
        content.append($("<h4>").html("Method Rows Preview"));
        content.append($("<div>").html(`The simulator contains a preview of the first few rows that it will ring. If the simulator appears to be messing up, this can
            be helpful to figure out what is going wrong. It's always possible that the method notation was entered incorrectly! If you find a problem, please email 
            dev@offenwanger.ca to explain where you found the issue and I will try to fix it when I have time.`));
        content.append($("<br>"));

 
        content.append($("<h4>").html("About this Simulator"));
        content.append($("<div>").html(`This simulator was developed by Anna Offenwanger for the use of the Vancouver Society of Change Ringers 
            (<a href="http://vscr.ca/" target="_blank">http://vscr.ca/</a>). 
            The Chrome extension and code are freely available under the MIT license. 
            To review the code or the license, please see 
            <a href="https://github.com/offenwanger/ringing_simulator/" target="_blank">https://github.com/offenwanger/ringing_simulator/</a>. 
            If you have any questions or comments about the simulator, please email dev@offenwanger.ca`));

        return menu;
    }

    function createInterface(openToggle, methodSet, helpMenu) {
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
        goModeSelector.append($("<option>").attr("value", c.FOLLOW_COMMANDS).html("Wait for go / That's all"));
        goModeSelector.on("change", function () {
            goMode = this.value
        })
        goModeSelector.val(goMode);
        interface.append(goModeSelector);
        interface.append($("<br>"))
        interface.append($("<br>"))

        let pealSpeedHoursInput = $("<input>").attr("type", "number").attr("min", 1).attr("style", "width:50px");
        let pealSpeedMinutesInput = $("<input>").attr("type", "number").attr("min", -1).attr("max", 60).attr("style", "width:50px");
        pealSpeedHoursInput.val(Math.floor(pealSpeedInHours))
        pealSpeedMinutesInput.val(Math.round((pealSpeedInHours * 60) % 60))
        let onPealSpeechChange = function () { 
            let hours = parseInt(pealSpeedHoursInput.val());
            let minutes = parseInt(pealSpeedMinutesInput.val());
            if(isNaN(hours) || hours == 0) {
                hours = 1;
                pealSpeedHoursInput.val(1);
            }
            if(isNaN(minutes)) {
                minutes = 0;
                pealSpeedMinutesInput.val(0)
            }

            pealSpeedInHours = hours + (minutes / 60); 
        };
        pealSpeedHoursInput.on("change", onPealSpeechChange)
        pealSpeedMinutesInput.on('input', function() {
            if(pealSpeedMinutesInput.val() < 0) {
                pealSpeedMinutesInput.val(59)
            } else if (pealSpeedMinutesInput.val() > 59) {
                pealSpeedMinutesInput.val(0)
            }
            
            onPealSpeechChange();
        });
    
        interface.append($("<span>").html("Peal Speed"));
        interface.append($("<br>"));
        interface.append($("<span>").html("Hours: "));
        interface.append(pealSpeedHoursInput);
        interface.append($("<br>"))
        interface.append($("<span>").html("Minutes: "));
        interface.append(pealSpeedMinutesInput);
        interface.append($("<br>"))
        interface.append($("<br>"))

        let methodSelect = $("<select>").css("width", "170px");
        // Note: This will make this unusuable without a mouse. This can be fixed,
        // but it's somewhat complecated. 
        methodSelect.on("focus",function() {methodSelect.blur()});
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
                placeNotationCallback(placeNotationTextInput.val().trim());
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
        
        let helpButton = $("<button>").html("?").on("click", function () { 
            helpMenu.show();
        })
        topButtonDiv.append(helpButton);

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
        getPealSpeed:()=>pealSpeedInHours
    }
})();