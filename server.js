var restify = require('restify');
var builder = require('botbuilder');
var request = require("request");

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
// Add first run dialog
bot.dialog('firstRun',
    function (session) {

        session.userData.version = 1.0;

        session.endDialog("Hei Kjetil! Hva kan jeg hjelpe deg med?");
    }).triggerAction({
        onFindAction: function (context, callback) {
            // Trigger dialog if the users version field is less than 1.0
            // - When triggered we return a score of 1.1 to ensure the dialog is always triggered.
            var ver = context.userData.version || 0;
            var score = ver < 1.0 ? 1.1 : 0.0;
            callback(null, score);
        },
        onInterrupted: function (session, dialogId, dialogArgs, next) {
            // Prevent dialog from being interrupted.
            session.send("Sorry... We need some information from you first.");
        }
    });

bot.dialog('/', [
    function (session) {
        var card = createRunarCard(session);

        // attach the card to the reply message
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.beginDialog('/askQuestion');

    }
]);

bot.dialog('/askQuestion', [
    function (session) {

        builder.Prompts.text(session, 'Hva kan jeg hjelpe deg med?');
        
    },
    function (session, results)
    {
        var image = "";
        var message = "";
        var res = "";
        //res = results.response.match(/^feriepenger/i);
        res = results.response;
        if (res == "hei") {
            session.beginDialog('/');
            return;
        }
        if (res.indexOf("feriepeng")>-1)
        {
            message = "Feriepengene kommer vanligvis 20. juni, men du fikk dine forh&aring;ndsutbetalt 12. februar.";
            image = "https://media1.giphy.com/media/LCdPNT81vlv3y/200.webp#1";
        }
        else if (res.indexOf("ferie") > -1) {
            message = "Du er satt opp med ferie fra 23. juni til 31. august.";
            image = "https://media2.giphy.com/media/5xtDarqlsEW6F7F14Fq/200.webp#0";
        }
        else if (res.indexOf("tilgjengelig") > -1) {
            message = "Disse har delvis ledig tid.";
            image = "https://runarbot.azurewebsites.net/images/kapasitet.png";
        }
        else if (res.indexOf("lunsj") > -1) {
            message = "Disse har delvis ledig tid.";
            image = "https://runarbot.azurewebsites.net/images/bacon.png";
        }
        else {
            message = "Det sp&oslash;rsm&aring;let forstod jeg ikke!";
            image = "https://media4.giphy.com/media/l41YBu8vgBGUHmGGI/200.webp#45";
        }
        
        var card = createSimpleCard(session, message, image);
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);

        session.beginDialog('/askQuestion');
    }
]);


//bot.dialog('/freeText', new builder.IntentDialog()
//    .matches(/^hello/i, function (session) {
//        session.send("Hi there!");
//    })
//    .onDefault(function (session) {
//        session.send("I didn't understand. Say hello to me!");
//    }));

// Serve a static web page
server.get(/.*/, restify.serveStatic({
    'directory': '.',
    'default': 'index.html'

}));
function createRunarCard(session) {
    return new builder.HeroCard(session)
        .title('Hei!! Du lurer antageligvis p&aring; noe. ')
        .subtitle('')
        .text('')
        .images([
            builder.CardImage.create(session, 'https://pbs.twimg.com/profile_images/1842901472/Photo_400x400.jpg')
        ]);
}

function createSimpleCard(session, message, image) {
    return new builder.HeroCard(session)
        .title(message)
        .images([
            builder.CardImage.create(session, image)
        ]);
}
function createCourseCard(session, course) {
    return new builder.HeroCard(session)
        .title("[" + course[0] + "] " + course[1])
        .subtitle(course[4])
        .text('This course will give you the following skills: ' + course[3])
        .images([
            builder.CardImage.create(session, course[2])
        ]);
}
function createWelcomeCard(session, course) {
    return new builder.HeroCard(session)
        .title('Congrats, you are on your way to become awesome!')
        .subtitle('Start the course: ' + course)
        .text('')
        .images([
            builder.CardImage.create(session, 'https://s-media-cache-ak0.pinimg.com/originals/a4/e1/92/a4e1929007c3f46ca1ea19488475d65d.gif')
        ])
        .buttons([
            builder.CardAction.openUrl(session, 'https://aspc2017.sharepoint.com/sites/course/PTAssets/start.aspx', 'Get Awesome')
        ]);
}