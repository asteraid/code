/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2012, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * Contributor(s):
 *
 *
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Tokens at https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode#commonTokens
 *
*/

define('ace/mode/ini', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/ini_highlight_rules', 'ace/mode/folding/cstyle'], function(require, exports, module) {


var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var Tokenizer = require("../tokenizer").Tokenizer;
var IniHighlightRules = require("./ini_highlight_rules").IniHighlightRules;
var FoldMode = require("./folding/cstyle").FoldMode;

var Mode = function() {
    var highlighter = new IniHighlightRules();
    this.foldingRules = new FoldMode();
    this.$tokenizer = new Tokenizer(highlighter.getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = ";";
    this.blockComment = {start: "/*", end: "*/"};
}).call(Mode.prototype);

exports.Mode = Mode;
});

define('ace/mode/ini_highlight_rules', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/mode/text_highlight_rules'], function(require, exports, module) {


var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var IniHighlightRules = function() {

    this.$rules = { start: 
       [ { token: 'punctuation.definition.comment.ini',
           regex: '#.*',
           push_: 
            [ { token: 'comment.line.number-sign.ini',
                regex: '$',
                next: 'pop' },
              { defaultToken: 'comment.line.number-sign.ini' } ] },
         { token: 'punctuation.definition.comment.ini',
           regex: ';.*',
           push_: 
            [ { token: 'comment.line.semicolon.ini', regex: '$', next: 'pop' },
              { defaultToken: 'comment.line.semicolon.ini' } ] },
         { token: 'constant.language',
           regex: '^\\s*\\b([a-zA-Z0-9_.-]+)\\b(\\s*)(=)' },
         { token: 'constant.numeric',
           regex: '[0-9]+' },
         { token: 'variable.language'  ,
           regex: '\\$\\{[a-zA-Z0-9_]+\\}' },
         { token: 'keyword.bold',
           regex: /AddQueueMember|ADSIProg|AELSub|AgentLogin|AgentMonitorOutgoing|AGI|AlarmReceiver|AMD|Answer|Authenticate|BackGround|BackgroundDetect|Bridge|Busy|CallCompletionCancel|CallCompletionRequest|CELGenUserEvent|ChangeMonitor|ChanIsAvail|ChannelRedirect|ChanSpy|ClearHash|ConfBridge|Congestion|ContinueWhile|ControlPlayback|DAHDIAcceptR2Call|DAHDIBarge|DAHDIRAS|DAHDIScan|DAHDISendCallreroutingFacility|DAHDISendKeypadFacility|DateTime|DBdel|DBdeltree|DeadAGI|Dial|Dictate|Directory|DISA|DumpChan|EAGI|Echo|EndWhile|ExecIfTime|ExecIf|Exec|ExitWhile|ExtenSpy|ExternalIVR|Festival|Flash|FollowMe|ForkCDR|GetCPEID|GosubIf|Gosub|GotoIfTime|GotoIf|Goto|Hangup|HangupCauseClear|IAX2Provision|ICES|ImportVar|Incomplete|IVRDemo|JabberJoin|JabberJoin_res_jabber|JabberJoin_res_xmpp|JabberLeave|JabberLeave_res_jabber|JabberLeave_res_xmpp|JabberSend|JabberSend_res_jabber|JabberSend_res_xmpp|JabberSendGroup|JabberSendGroup_res_jabber|JabberSendGroup_res_xmpp|JabberStatus|JabberStatus_res_jabber|JabberStatus_res_xmpp|JACK|Log|MacroIf|MacroExclusive|MacroExit|Macro|MailboxExists|MeetMe|MeetMeAdmin|MeetMeChannelAdmin|MeetMeCount|MessageSend|Milliwatt|MinivmAccMess|MinivmDelete|MinivmGreet|MinivmMWI|MinivmNotify|MinivmRecord|MixMonitor|Monitor|Morsecode|MP3Player|MSet|MusicOnHold|NBScat|NoCDR|NoOp|ODBC_Commit|ODBC_Rollback|ODBCFinish|Originate|OSPAuth|OSPFinish|OSPLookup|OSPNext|Page|ParkAndAnnounce|ParkedCall|Park|PauseMonitor|PauseQueueMember|Pickup|PickupChan|Playback|PlayTones|PrivacyManager|Proceeding|Progress|Queue|QueueLog|RaiseException|Read|ReadExten|ReadFile|ReceiveFAX|Record|RemoveQueueMember|ResetCDR|RetryDial|Return|Ringing|SayAlpha|SayCountedAdj|SayCountedNoun|SayCountPL|SayDigits|SayNumber|SayPhonetic|SayUnixTime|SendDTMF|SendFAX|SendImage|SendText|SendURL|SetAMAFlags|SetCallerPres|SetMusicOnHold|Set|SIPAddHeader|SIPDtmfMode|SIPRemoveHeader|SIPSendCustomINFO|SkelGuessNumber|SLAStation|SLATrunk|SMS|SoftHangup|SpeechActivateGrammar|SpeechBackground|SpeechCreate|SpeechDeactivateGrammar|SpeechDestroy|SpeechLoadGrammar|SpeechProcessingSound|SpeechStart|SpeechUnloadGrammar|StackPop|StartMusicOnHold|StopMixMonitor|StopMonitor|StopMusicOnHold|StopPlayTones|System|TestClient|TestServer|Transfer|TryExec|TrySystem|UnpauseMonitor|UnpauseQueueMember|UserEvent|Verbose|VMAuthenticate|VMSayName|VoiceMail|VoiceMailMain|VoiceMailPlayMsg|WaitExten|WaitForNoise|WaitForRing|WaitForSilence|WaitMusicOnHold|WaitUntil|Wait|While|Zapateller/ },
 
         { token: 
            [ 'punctuation.definition.entity.ini',
              'constant.section.group-title.ini',
              'punctuation.definition.entity.ini' ],
           regex: '^(\\[)(.*?)(\\])' },
         { token: 'punctuation.definition.string.begin.ini',
           regex: '\'',
           push: 
            [ { token: 'punctuation.definition.string.end.ini',
                regex: '\'',
                next: 'pop' },
              { token: 'constant.character.escape.ini', regex: '\\\\.' },
              { defaultToken: 'string.quoted.single.ini' } ] },
         { token: 'punctuation.definition.string.begin.ini',
           regex: '"',
           push: 
            [ { token: 'punctuation.definition.string.end.ini',
                regex: '"',
                next: 'pop' },
              { defaultToken: 'string.quoted.double.ini' } ] },
         { caseInsensitive: true }
      ] }
    
    this.normalizeRules();
};

IniHighlightRules.metaData = { fileTypes: [ 'ini', 'conf' ],
      keyEquivalent: '^~I',
      name: 'Ini',
      scopeName: 'source.ini' }


oop.inherits(IniHighlightRules, TextHighlightRules);

exports.IniHighlightRules = IniHighlightRules;
});

define('ace/mode/folding/cstyle', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/range', 'ace/mode/folding/fold_mode'], function(require, exports, module) {


var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var line = session.getLine(row);
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i + match[0].length, 1);
        }

        if (foldStyle !== "markbeginend")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };

}).call(FoldMode.prototype);

});
