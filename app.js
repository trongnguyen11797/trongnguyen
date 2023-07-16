const express = require('express');
const { Client } = require('ssh2');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/execute-ssh-command', (req, res) => {
  const { password } = req.body;

  const conn = new Client();

  conn.on('ready', () => {
    conn.exec('/ip firewall nat add chain=dstnat protocol=tcp dst-port=80 action=dst-nat to-addresses=192.168.1.1 to-ports=80', (err, stream) => {
      if (err) throw err;
      
      let commandOutput = '';

      stream
        .on('close', (code, signal) => {
          conn.end();
          res.send(commandOutput);
        })
        .on('data', (data) => {
          commandOutput += data;
        })
        .stderr.on('data', (data) => {
          commandOutput += data;
        });
    });
  });

  conn.on('error', (err) => {
    console.error(err);
    res.status(500).send('SSH connection error');
  });

  conn.connect({
    host: '192.168.55.1',
    port: '22',
    username: 'admin',
    password: password
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
