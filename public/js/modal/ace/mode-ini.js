define("ace/mode/ini_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var escapeRe = "\\\\(?:[\\\\0abtrn;#=:]|x[a-fA-F\\d]{4})";

var appnames = '%ID%|%PASSWORD%|%NAME%|%SERVER%|%MAC%|AddQueueMember|ADSIProg|AELSub|AgentLogin|AgentMonitorOutgoing|AGI|AlarmReceiver|AMD|Answer|Authenticate|BackGround|BackgroundDetect|Bridge|Busy|CallCompletionCancel|CallCompletionRequest|CELGenUserEvent|ChangeMonitor|ChanIsAvail|ChannelRedirect|ChanSpy|ClearHash|ConfBridge|Congestion|ContinueWhile|ControlPlayback|DAHDIAcceptR2Call|DAHDIBarge|DAHDIRAS|DAHDIScan|DAHDISendCallreroutingFacility|DAHDISendKeypadFacility|DateTime|DBdel|DBdeltree|DeadAGI|Dial|Dictate|Directory|DISA|DumpChan|EAGI|Echo|EndWhile|ExecIfTime|ExecIf|Exec|ExitWhile|ExtenSpy|ExternalIVR|Festival|Flash|FollowMe|ForkCDR|GetCPEID|GosubIf|Gosub|GotoIfTime|GotoIf|Goto|Hangup|HangupCauseClear|IAX2Provision|ICES|ImportVar|Incomplete|IVRDemo|JabberJoin|JabberJoin_res_jabber|JabberJoin_res_xmpp|JabberLeave|JabberLeave_res_jabber|JabberLeave_res_xmpp|JabberSend|JabberSend_res_jabber|JabberSend_res_xmpp|JabberSendGroup|JabberSendGroup_res_jabber|JabberSendGroup_res_xmpp|JabberStatus|JabberStatus_res_jabber|JabberStatus_res_xmpp|JACK|Log|MacroIf|MacroExclusive|MacroExit|Macro|MailboxExists|MeetMe|MeetMeAdmin|MeetMeChannelAdmin|MeetMeCount|MessageSend|Milliwatt|MinivmAccMess|MinivmDelete|MinivmGreet|MinivmMWI|MinivmNotify|MinivmRecord|MixMonitor|Monitor|Morsecode|MP3Player|MSet|MusicOnHold|NBScat|NoCDR|NoOp|ODBC_Commit|ODBC_Rollback|ODBCFinish|Originate|OSPAuth|OSPFinish|OSPLookup|OSPNext|Page|Park|ParkAndAnnounce|ParkedCall|PauseMonitor|PauseQueueMember|Pickup|PickupChan|Playback|PlayTones|PrivacyManager|Proceeding|Progress|Queue|QueueLog|RaiseException|Read|ReadExten|ReadFile|ReceiveFAX|Record|RemoveQueueMember|ResetCDR|RetryDial|Return|Ringing|SayAlpha|SayCountedAdj|SayCountedNoun|SayCountPL|SayDigits|SayNumber|SayPhonetic|SayUnixTime|SendDTMF|SendFAX|SendImage|SendText|SendURL|Set|SetAMAFlags|SetCallerPres|SetMusicOnHold|SIPAddHeader|SIPDtmfMode|SIPRemoveHeader|SIPSendCustomINFO|SkelGuessNumber|SLAStation|SLATrunk|SMS|SoftHangup|SpeechActivateGrammar|SpeechBackground|SpeechCreate|SpeechDeactivateGrammar|SpeechDestroy|SpeechLoadGrammar|SpeechProcessingSound|SpeechStart|SpeechUnloadGrammar|StackPop|StartMusicOnHold|StopMixMonitor|StopMonitor|StopMusicOnHold|StopPlayTones|System|TestClient|TestServer|Transfer|TryExec|TrySystem|UnpauseMonitor|UnpauseQueueMember|UserEvent|Verbose|VMAuthenticate|VMSayName|VoiceMail|VoiceMailMain|VoiceMailPlayMsg|WaitExten|WaitForNoise|WaitForRing|WaitForSilence|WaitMusicOnHold|WaitUntil|Wait|While|Zapateller' ;
var extprio = '[\(_0-9a-zA-Z\)]';
var extname = '[\_\.\!\\[\\-\\]\#\*0-9a-zA-Z]+' + extprio + '*';

var IniHighlightRules = function() {
    this.$rules = {
        start: [{
            token: 'punctuation.definition.comment.ini',
            regex: '#.*',
            push_: [{
                token: 'comment.line.number-sign.ini',
                regex: '$|^',
                next: 'pop'
            }, {
                defaultToken: 'comment.line.number-sign.ini'
            }]
        },{
            token: 'punctuation.definition.comment.ini',
            regex: ';.*',
            push_: [{
                token: 'comment.line.semicolon.ini',
                regex: '$|^',
                next: 'pop'
            }, {
                defaultToken: 'comment.line.semicolon.ini'
            }]
        },{
            token: 'punctuation.definition.string.begin.ini',
            regex: '"',
            push: [{
                token: "constant.language.escape",
                regex: escapeRe
            }, 
            {
                token: 'punctuation.definition.string.end.ini',
                regex: '"',
                next: 'pop'
            }, {
                defaultToken: 'string.quoted.double.ini'
            }]
        },{
            token:['keyword.other.definition.ini', 'punctuation.separator.key-value.ini', 'constant.numeric', 'text', 'application'],
            regex:'(\\s*same)(\\s*=>?\\s*)(' + extprio + '+)(,)(' + appnames + ')'
        },{
            token:['keyword.other.definition.ini', 'punctuation.separator.key-value.ini', 'constant.numeric', 'text', 'constant.numeric', 'text', 'application'],
            regex:'(\\s*exten)(\\s*=>?\\s*)(' + extname + ')(,)(' + extprio + '+)(,)(' + appnames + ')'
        },{
            token:['keyword.other.definition.ini', 'punctuation.separator.key-value.ini', 'constant.section.group-title.ini'],
            regex:'(\\s*include\\s*)(=>?)(\\s.+)'
        },{
            token:['keyword.other.definition.ini', 'punctuation.separator.key-value.ini', 'constant.string'],
            regex:'(^\\s*\\w+)(\\s*=>?\\s*)(.*)'
        },{
            token:['punctuation.definition.entity.ini','constant.section.group-title.ini','punctuation.definition.entity.ini'],
            regex:'^(\\[)(.*?)(\\])'
//        },{
//            token: 'application',
//            regex: appnames
        },{ 
            token: 'variable',    
            regex: '\\$\{[0-9a-zA-Z_\\(\\)]+\}'
        },{
            token: 'constant.numeric',    
            regex: '[0-9\.]+'
        },{
            token: 'punctuation.definition.string.begin.ini',
            regex: "'",
            push: [{
                token: 'punctuation.definition.string.end.ini',
                regex: "'",
                next: 'pop'
            }, {
                token: "constant.language.escape",
                regex: escapeRe
            }, {
                defaultToken: 'string.quoted.single.ini'
            }]
        }]
    };

    this.normalizeRules();
};

IniHighlightRules.metaData = {
    fileTypes: ['ini', 'conf'],
    keyEquivalent: '^~I',
    name: 'Ini',
    scopeName: 'source.ini'
};


oop.inherits(IniHighlightRules, TextHighlightRules);

exports.IniHighlightRules = IniHighlightRules;
});

define("ace/mode/folding/ini",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function() {
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

    this.foldingStartMarker = /^\s*\[([^\])]*)]\s*(?:$|[;#])/;

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var re = this.foldingStartMarker;
        var line = session.getLine(row);
        
        var m = line.match(re);
        
        if (!m) return;
        
        var startName = m[1] + ".";
        
        var startColumn = line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;

        while (++row < maxRow) {
            line = session.getLine(row);
            if (/^\s*$/.test(line))
                continue;
            m = line.match(re);
            if (m && m[1].lastIndexOf(startName, 0) !== 0)
                break;

            endRow = row;
        }

        if (endRow > startRow) {
            var endColumn = session.getLine(endRow).length;
            return new Range(startRow, startColumn, endRow, endColumn);
        }
    };

}).call(FoldMode.prototype);

});

define("ace/mode/ini",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/ini_highlight_rules","ace/mode/folding/ini"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var IniHighlightRules = require("./ini_highlight_rules").IniHighlightRules;
var FoldMode = require("./folding/ini").FoldMode;

var Mode = function() {
    this.HighlightRules = IniHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = ";";
    this.blockComment = null;
    this.$id = "ace/mode/ini";
}).call(Mode.prototype);

exports.Mode = Mode;
});
