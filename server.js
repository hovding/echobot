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

        var userName = 'Mr. Anderson';
        session.userData.name = userName;
        session.endDialog("Hello. What can I do for you?");
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
        var card = createHeroCard(session);

        // attach the card to the reply message
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        
        var options = {
            method: "GET",
            uri: "https://edupointfunctions.azurewebsites.net/api/GetCourses?code=DgYmyYcPweOrlBcZaW6obk6Rzj0Kl6hymsLyiI69Gvp1NoqKDEgJAg=="
        };
        request(options, function (error, res, body) {
            if (error) {
                reject('error:' + error);
            }
            var resultBody = JSON.parse(body);
            //session.send(resultBody);

            var arr = resultBody.split(";");
            var chooseArr = [];
            arr.forEach(function (element) {
                var course = element.split("|");
                var card = createCourseCard(session, course);
                var msg = new builder.Message(session).addAttachment(card);
                session.send(msg);
                chooseArr.push(course[1] + " ["+course[0]+"]");
            });
            builder.Prompts.choice(session, "Which course do you want to sign up for?", chooseArr);
        });
       
    },
    function (session, results) {

        var course = results.response.entity;
        var courseNumber = course.split("[")[1];
        courseNumber = courseNumber.slice(0, -1);
        //session.send(courseNumber);
        var options = {
            method: "GET",
            uri: "https://edupointfunctions.azurewebsites.net/api/CreateListItemPnP?code=QNsLm8MlwdMkLQnYaalwr/DbMKd/kFHKilF3G6OciNuGLyXbtsOVKA==&name=SignedUpFromBot&courseid=" + courseNumber + "&userid=18"
        };
        request(options, function (error, res, body) {
            //context.log("ETTER FUNCTIONS KALL :" + body);
            if (error) {
                // context.log('error:' + error);
                reject('error:' + error);
            }
            var resultBody = JSON.parse(body);
            //session.send(body);
        });
        // Sets sessionvariable
        //session.userData.name = results.response;
        var card = createWelcomeCard(session, course);
        var msg = new builder.Message(session).addAttachment(card);
        session.endDialog(msg);
        //session.endDialog('Is there anything else I could help you with?');
    }

]);

// Serve a static web page
server.get(/.*/, restify.serveStatic({
    'directory': '.',
    'default': 'index.html'

}));
function createHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Hello, I am your host, Mr. Botswana')
        .subtitle('Here are the courses you can attend:')
        .text('')
        .images([
            builder.CardImage.create(session, 'http://gfx.dagbladet.no/labrador/403/403598/40359838/jpg/active/978x409.jpg')
        ]);
}
function createCourseCard(session, course) {
    return new builder.HeroCard(session)
        .title("["+ course[0] +"] " +course[1])
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