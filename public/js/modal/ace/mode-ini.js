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
         { token: ['keyword.operator', 'punctuation.definition.entity.ini', 'keyword.operator', 'punctuation.definition.comment.ini'],
           regex: '(^\\s*exten|^\\s*same|^\\s*include)(\\s*=\\>?)(\\s*[_*a-zA-Z0-9.]+)(\\,|\\([a-zA-Z0-9]+\\))' },
         { token: 'constant.language',
           regex: '^\\s*([a-zA-Z0-9_.-]+)\\s*' },
         { token: 'constant.numeric',
           regex: '[0-9]+' },
         { token: 'variable.language'  ,
           regex: '\\$\\{[a-zA-Z0-9_]+\\}' },
         { token: ['keyword.bold', 'punctuation.definition.entity.ini'],
           regex: '(Zapateller|While|WaitUntil|WaitMusicOnHold|WaitForSilence|WaitForRing|WaitForNoise|WaitExten|Wait|VoiceMailPlayMsg|VoiceMailMain|VoiceMail|VMSayName|VMAuthenticate|Verbose|UserEvent|UnpauseQueueMember|UnpauseMonitor|TrySystem|TryExec|Transfer|TestServer|TestClient|System|StopPlayTones|StopMusicOnHold|StopMonitor|StopMixMonitor|StartMusicOnHold|StackPop|SpeechUnloadGrammar|SpeechStart|SpeechProcessingSound|SpeechLoadGrammar|SpeechDestroy|SpeechDeactivateGrammar|SpeechCreate|SpeechBackground|SpeechActivateGrammar|SoftHangup|SMS|SLATrunk|SLAStation|SkelGuessNumber|SIPSendCustomINFO|SIPRemoveHeader|SIPDtmfMode|SIPAddHeader|SetMusicOnHold|SetCallerPres|SetAMAFlags|Set|SendURL|SendText|SendImage|SendFAX|SendDTMF|SayUnixTime|SayPhonetic|SayNumber|SayDigits|SayCountPL|SayCountedNoun|SayCountedAdj|SayAlpha|Ringing|Return|RetryDial|ResetCDR|RemoveQueueMember|Record|ReceiveFAX|ReadFile|ReadExten|Read|RaiseException|QueueLog|Queue|Progress|Proceeding|PrivacyManager|PlayTones|Playback|PickupChan|Pickup|PauseQueueMember|PauseMonitor|ParkedCall|ParkAndAnnounce|Park|Page|OSPNext|OSPLookup|OSPFinish|OSPAuth|Originate|ODBC_Rollback|ODBCFinish|ODBC_Commit|NoOp|NoCDR|NBScat|MusicOnHold|MSet|MP3Player|Morsecode|Monitor|MixMonitor|MinivmRecord|MinivmNotify|MinivmMWI|MinivmGreet|MinivmDelete|MinivmAccMess|Milliwatt|MessageSend|MeetMeCount|MeetMeChannelAdmin|MeetMeAdmin|MeetMe|MailboxExists|MacroIf|MacroExit|MacroExclusive|Macro|Log|JACK|JabberStatus_res_xmpp|JabberStatus_res_jabber|JabberStatus|JabberSend_res_xmpp|JabberSend_res_jabber|JabberSendGroup_res_xmpp|JabberSendGroup_res_jabber|JabberSendGroup|JabberSend|JabberLeave_res_xmpp|JabberLeave_res_jabber|JabberLeave|JabberJoin_res_xmpp|JabberJoin_res_jabber|JabberJoin|IVRDemo|Incomplete|ImportVar|ICES|IAX2Provision|HangupCauseClear|Hangup|GotoIfTime|GotoIf|Goto|GosubIf|Gosub|GetCPEID|ForkCDR|FollowMe|Flash|Festival|ExternalIVR|ExtenSpy|ExitWhile|ExecIfTime|ExecIf|Exec|EndWhile|Echo|EAGI|DumpChan|DISA|Directory|Dictate|Dial|DeadAGI|DBdeltree|DBdel|DateTime|DAHDISendKeypadFacility|DAHDISendCallreroutingFacility|DAHDIScan|DAHDIRAS|DAHDIBarge|DAHDIAcceptR2Call|ControlPlayback|ContinueWhile|Congestion|ConfBridge|ClearHash|ChanSpy|ChannelRedirect|ChanIsAvail|ChangeMonitor|CELGenUserEvent|CallCompletionRequest|CallCompletionCancel|Busy|Bridge|BackgroundDetect|BackGround|Authenticate|Answer|AMD|AlarmReceiver|AGI|AgentMonitorOutgoing|AgentLogin|AELSub|ADSIProg|AddQueueMember)(\\()' },
 
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

         {
            caseInsensitive: true
         }
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
