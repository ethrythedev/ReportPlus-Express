# ReportPlus-Express
A web-based GUI for Report+

![Screenshot of the Report Plus Express web app](https://i-need-to-go.to-sleep.xyz/r/reportplus-webapp-screenshot.png)


## Installation

### Prerequisites
* You will need [Node.js](https://nodejs.org/en)
* It is recommended to use [PNPM](https://pnpm.io)
* Your Minecraft server will need the [Report+](https://www.spigotmc.org/resources/%E2%80%8D%E2%9C%A8-report-simple-reporting-system.114034/) (or compatible) plugin

### Steps
1. Download the latest release (or run `git clone https://github.com/ethrythedev/ReportPlus-Express.git`)
2. Install the dependencies with `pnpm install`
3. Change the configuration files in /config/ (you can configure the MySQL database connection in /config/server.yml and the web server in /config/web.yml)
4. Run `node .`
5. Once the server starts, you will be told what to change in your plugin config.yml file
6. After changing your ReportPlus plugin configuration file, run `/reportplus reload` in the console
7. You can now view reports by running `/reports` in your Minecraft server and visiting the link shown in chat.
