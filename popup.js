// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#takeAll').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Took All Bells"
        message("takeAll") 
    });

    document.querySelector('#takeRemaining').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Taken remaining Bells"
        message("takeRemaining") 
    });

    
    document.querySelector('#dropAll').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Dropped All Bells"
        message("dropAll") 
    });
  
});

function message(type, parameters = {}) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type, ...parameters});
    });
}
