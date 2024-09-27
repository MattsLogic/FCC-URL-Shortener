require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//requiring body parser to be used
const bodyParser = require('body-parser');
//this was not included but wont work unless i allow it, i also added it to the dependencies
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3001;

app.use(cors());
//body parser used for entire app
app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urlDatabase = {};

//POST for form submission of URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  //regex is any string that starts with "https://www." this also allows for http:// with use of '?' marks
  const regex = /^https?:\/\/(www\.)?.+/;

  //checking if original url is invalid based on our outlined regex and if so ending the function and returning error
  if(!regex.test(originalUrl)) {
    return res.json({error: 'invalid url'})
  }
  //extracting hostname or domain name by using JS URL constructor to create an object of passed string
  const domain = new URL(originalUrl).hostname;

  //This is dns looking up the hostname and returning a paired IP address
  dns.lookup(domain, (err, addresses) => {
    //return error if no IP found
    if(err) {
      return res.json({error: 'invalid url'});
    }
    //still inside the dns.lookup function, we're checking if the IP is found and if so we'll make a special number key to define it
      //and store it with its original URL string within the urlDatabase, it'll look like this: urlDatabase = {'1': originalUrl, '2': originalUrl...}
    let shortUrl = Object.keys(urlDatabase).length + 1;
    urlDatabase[shortUrl] = originalUrl;

    return res.json({'original_url': originalUrl, 'short_url': shortUrl});
  })
})


//now we serve a redirect for client request of short URL. If no match in database we return error
app.get('/api/shorturl/:shorturl', (req, res) => {
  //defining short url by way of client entered parameters
  const shortUrl = req.params.shorturl;
  //defining original url by connecting it to key entered by client, if no, it becomes null
  const originalUrl = urlDatabase[shortUrl];

  if(originalUrl) {
    res.redirect(originalUrl)
  } else {
    return res.json({error: 'no short URL found in database'});
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
