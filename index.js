const yaml = require('js-yaml');
const express = require('express');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const cache = require('memory-cache');

const app = express();

const webconfig = yaml.load(fs.readFileSync("config/web.yml"))
const serverconfig = yaml.load(fs.readFileSync("config/server.yml"))

const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: serverconfig["db_host"] + (serverconfig["db_port"] != 3306 ? ":" + serverconfig["db_port"] : ""),
        user: serverconfig["db_username"],
        password: serverconfig["db_password"],
        database: serverconfig["db_database"],
    },
});

const port = webconfig["port"];

async function getUsernameFromUUID(uuid) {
    const url = `https://playerdb.co/api/player/minecraft/${uuid}`;
    const headers = {
        'User-Agent': 'ReportPlus Web App -- GitHub repo: https://github.com/ethrythedev/ReportPlus-Express',
    };

    try {
        const response = await axios.get(url, {
            headers
        });

        if (response.data.success && response.data.data && response.data.data.player && response.data.data.player.username) {
            return response.data.data.player.username;
        } else {
            throw new Error('Username not found');
        }
    } catch (error) {
        throw error;
    }
}

// / route
app.get('/', async (req, res) => {
    if (req.query.l) {
        const loginID = req.query.l;
        knex('reportGuiCodes')
            .where({
                code: loginID
            })
            .first()
            .then(existingCode => {
                if (existingCode) {
                  knex('reports')
                      .select('*')
                      .modify(function(queryBuilder) {
                          if (req.query.showArchived == null || req.query.showArchived == "false") {
                              queryBuilder.where('isarchived', false);
                          }
                      })
                      .limit(50)
                      .then(rows => {
                            let reports = rows.map(row => ({
                                id: row.id,
                                reporter: row.reporter,
                                reported: row.reported,
                                reason: row.reason,
                                timems: new Date(parseInt(row.timems)).toLocaleString(),
                                isarchived: row.isarchived ? "true" : "false",
                            }));

                            reports = reports.sort((a, b) => b.id - a.id);

                            res.send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <link rel="stylesheet" href="https://unpkg.com/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                          <link rel="stylesheet" href="https://unpkg.com/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css">
                          <script src="https://unpkg.com/jquery@3.7.1/dist/jquery.min.js"></script>
                          <title>Reports | ReportPlus</title>

                          <style>.fullTopRight { position: fixed; top: 10px; right: 10px; }</style>
                        </head>
                        <body>
                          <a href="/logout?l=${loginID}" class="fullTopRight btn btn-light"><i class="bi bi-box-arrow-left"></i> Logout</a>

                          <div class="container mt-5">
                            <h2>Reports</h2>
                            <p>Showing the last 50 results.</p>
                            <div class="form-check form-switch">
                              <input class="form-check-input" type="checkbox" role="switch" reportShowArchivedCheck" oninput="if(!this.checked) {window.location.href='?l=${req.query.l}&showArchived=false'} else {window.location.href='?l=${req.query.l}&showArchived=true'}" ${(req.query.showArchived == null || req.query.showArchived == "false") ? "" : "checked"}>
                              <label class="form-check-label" for="reportShowArchivedCheck">Include archived results</label>
                            </div>
                            <table class="table table-striped">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Reporter</th>
                                  <th>Reported</th>
                                  <th>Reason</th>
                                  <th>Timestamp</th>
                                  <th>Archived</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${reports.map(report => `
                                  <tr>
                                    <td>${report.id}</td>
                                    <td class="setToUsername includesHead">${report.reporter} <span aria-hidden="true" class="spinner-border text-secondary spinner-border-sm"></span></td>
</td>
                                    <td class="setToUsername includesHead">${report.reported} <span aria-hidden="true" class="spinner-border text-secondary spinner-border-sm"></span></td>
                                    <td>${report.reason}</td>
                                    <td>${report.timems}</td>
                                    <td>${report.isarchived} ${report.isarchived == "false" ? '<a href="/archive?id='+report.id+'&l='+req.query.l+'"><i class="bi bi-archive-fill"></i></a>' : '' }</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          </div>
                          <script src="https://unpkg.com/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

                          <script>
                              window.onload = function () {
                                const elements = document.querySelectorAll('.setToUsername');
                                elements.forEach((element, index) => {
                                  $.get("/getUsernameFromUUID?uuid="+element.innerText, function(data, status){
                                    uuid = element.innerText.replace(" ", "");

                                    element.title = uuid;
                                    element.innerText = data;

                                    if(element.classList.contains("includesHead")) {
                                      element.innerHTML = "<img alt='head' aria-hidden='true' src='https://mc-heads.net/avatar/"+uuid+"/32' height='24px' width='24px'> " + element.innerText;
                                    }
                                  });
                                });
                              }
                          </script>
                        </body>
                        </html>
                      `);
                        })
                        .catch(error => {
                            res.send("Unexpected error occurred while listing reports.");
                        });
                } else {
                    res.send("Error while logging in. Try running /reports again.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                res.send("Unexpected error");
            });
    } else {
        res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <title>Report+ WebGUI</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://unpkg.com/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
          <script src="https://unpkg.com/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
          <style>
              @import url(https://fonts.bunny.net/css?family=roboto:100,100i,300,300i,400,400i,500,500i,700,700i,900,900i);
              .fullcenter {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  text-align: center;
                  font-family: 'Roboto', serif;
              }
          </style>
      </head>
      <body>
          <div class="fullcenter">
              <h3 class="m-0 p-0">Run /reports in your server and continue from there.</h3>
          </div>
      </body>
      </html>
    `);
    }
});

// playerdb api proxy
app.get('/getUsernameFromUUID', async (req, res) => {
    if (req.query.uuid) {
        if (cache.get('username-for-' + req.query.uuid)) {
            res.send(cache.get('username-for-' + req.query.uuid));
        } else {
            try {
                getUsernameFromUUID(req.query.uuid).then(newUsername => {
                    cache.put('username-for-' + req.query.uuid, newUsername);

                    res.send(newUsername);
                });
            } catch (e) {
                res.send(req.query.uuid);
            }
        }
    } else {
        res.send("No UUID");
    }
});

// logout route
app.get('/logout', (req, res) => {
  if(!req.query.l) {
    res.send(0);
  }

  const loginID = req.query.l;

  knex('reportGuiCodes')
  .where({ code: loginID })
  .del()
  .then((numRowsDeleted) => {
    if (numRowsDeleted > 0) {
      res.redirect("/");
    } else {
      res.send("Couldn't log you out.");
    }
  })
  .catch((error) => {
    console.error("Error:", error);
    res.status(500).send("You couldn't be logged out.");
  });
});

// archive report route
app.get('/archive', async (req, res) => {
    const loginID = req.query.l;

    knex('reportGuiCodes')
        .where({
            code: loginID
        })
        .first()
        .then(existingCode => {
            if (!existingCode) {
                res.send("Error while authenticating");
                return;
            }
        });

    if (req.query.l) {
        try {
            const reportId = req.query.id;
            const updateResult = await knex('reports')
                .where({
                    id: reportId
                })
                .update({
                    isarchived: true
                });

            if (updateResult > 0) {
                console.log(`Report with ID ${reportId} has been marked as archived by user ${req.query.l}.`);
                res.redirect("/");
            } else {
                console.log(`Report with ID ${reportId} not found.`);
                res.redirect("/");
            }
        } catch (error) {
            console.error('Error:', error.message);
            res.send("Unexpected error. <a href='javascript:window.location.back()'>Go back</a>")
        }
    } else {
        res.send("You are not authenticated.");
    }
})

// start the web server
app.listen(port, () => {
    console.log(`Report+ Web Server is running on http://localhost:${port}.`);

    // get IP for console log
    http.get({
        'host': 'api.ipify.org',
        'port': 80,
        'path': '/'
    }, function(resp) {
        resp.on('data', function(ip) {
            console.log(`If you haven't already, please add https://${ip}:${port}/ to \`web_gui_url\` in the plugin \`config.yml\`.`)
        });
    });
});
