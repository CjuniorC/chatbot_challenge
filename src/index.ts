import * as BlipSdk from 'blip-sdk';
import * as WebSocketTransport from 'lime-transport-websocket'
import Fetch from 'node-fetch';

let IDENTIFIER = 'Example';  // put your information here.
let ACCESS_KEY = 'Example' // put your information here.

let repos = false;
let globalResponse: Array<any>;

let client = new BlipSdk.ClientBuilder()
  .withIdentifier(IDENTIFIER)
  .withAccessKey(ACCESS_KEY)
  .withTransportFactory(() => new WebSocketTransport())
  .build();

client.addMessageReceiver(true, function (message) {
  if (!repos) {
    Fetch('https://api.github.com/users/takenet/repos')
      .then(result => result.json())
      .then(data => {
        let temp = data.filter(a => a.language == 'C#') as Array<any>;
        temp = temp.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) as Array<any>;

        temp = temp.slice(0, 5);

        let response = [];

        temp.forEach(r => {
          response.push(
            {
              header: {
                type: "application/vnd.lime.media-link+json",
                value: {
                  title: r.full_name,
                  text: r.description,
                  type: "image/jpeg",
                  uri: r.owner.avatar_url
                }
              },
            }
          )
        });

        globalResponse = response;
        repos = true;

        client.sendMessage({
          type: "application/vnd.lime.collection+json",
          to: message.from,
          content: {
            itemType: "application/vnd.lime.document-select+json",
            items: response
          }
        });

      })
      .catch(err => {
        client.sendMessage({
          type: "text/plain",
          to: message.from,
          content: 'Sorry!, Something went wrong !'
        });
      })
  }
  else {
    client.sendMessage({
      type: "application/vnd.lime.collection+json",
      to: message.from,
      content: {
        itemType: "application/vnd.lime.document-select+json",
        items: globalResponse
      }
    });
  }
});

client.connect()
  .then(function (session) {
    console.log(session);
    repos = false;
    globalResponse = [];
  })
  .catch(function (err) { console.log(err)});


