const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const parser = import("java-parser");

class ControllerMappingsProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;

        this.mappings = {
            "m_DriverController": { defaultCommands: { "swerveSubsystem": ["leftX"] }, buttons: { "a": ["deployIntake"] }, dpad: { "90": ["setAngle"] }, joystick: ["xAxis"] },
            "m_OperatorController": { defaultCommands: { "armSubsystem": [] }, buttons: { "a": ["angleArm"] }, dpad: { "90": ["setAngle"] } },
        };
    }

    async findFile(dir, fileName) {
        const files = await fs.promises.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
                const foundFile = await this.findFile(filePath, fileName);
                if (foundFile) {
                    return foundFile;
                }
            } else if (file === fileName) {
                return filePath;
            }
        }

        return null;
    }

    async findAndProcessRobotContainer() {
        
        const workspaceFolder = vscode.workspace.workspaceFolders[0];

        const fileName = 'RobotContainer.java';

        const robotContainerFile = await this.findFile(workspaceFolder.uri.fsPath, fileName);

        if (robotContainerFile) {
            try {
                const fileContent = await fs.promises.readFile(robotContainerFile, 'utf-8');

                const ast = (await parser).parse(fileContent);

                console.log(ast);

                const astJson = JSON.stringify(ast, null, 2);

                console.log(astJson)

                const astFilePath = path.join(workspaceFolder.uri.fsPath, 'ast.json');

                await fs.writeFile(astFilePath, astJson, (err) => {
                    if (err)
                    console.log(err);
                  else {
                    console.log("File written successfully\n");
                  }
                });

                this.traverseFile(fileContent);

                this.refresh();
            } catch (error) {
                console.error('Error reading file:', error);
            }
        } else {
            vscode.window.showInformationMessage('RobotContainer.java file not found.');
        }
    }

    async traverseFile(content) {
       
     }


    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            // If no element is provided, return controllers
            return Object.keys(this.mappings).map(key => ({
                label: key,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: 'controller'
            }));
        } else if (element.contextValue === 'controller') {
            return [
                { label: 'Default Commands', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, contextValue: `${element.label}.defaultCommands` },
                { label: 'Buttons', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, contextValue: `${element.label}.buttons` },
                { label: 'DPad', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, contextValue: `${element.label}.dpad` },
                { label: 'Joystick', collapsibleState: vscode.TreeItemCollapsibleState.Collapsed, contextValue: `${element.label}.joystick` }
            ];
        } else {
            try {
                const controllerData = this.resolvePath(this.mappings, element.contextValue);
                if (controllerData instanceof Array && controllerData) {
                    return controllerData.map(val => ({
                        label: val,
                        collapsibleState: vscode.TreeItemCollapsibleState.None,
                        contextValue: `${element.contextValue}.${val}`
                    }));
                } else if (controllerData instanceof Object && controllerData) {
                    return Object.keys(controllerData).map(key => ({
                        label: key,
                        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                        contextValue: `${element.contextValue}.${key}`
                    }));
                }
            } catch (error) {
                console.error('Error getting children:', error);
            }
        }
        return [];
    }

    resolvePath(obj, path) {
        const splitted = path.split(".");
        let toReturn = obj;

        splitted.forEach(element => {
            toReturn = toReturn[element];
        });

        return toReturn;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

function activate(context) {
    const controllerMappingsProvider = new ControllerMappingsProvider();
    vscode.window.registerTreeDataProvider('controllerbindings', controllerMappingsProvider);

    context.subscriptions.push(vscode.commands.registerCommand('controllerbindings.refreshControllerMappings', () => {
        controllerMappingsProvider.findAndProcessRobotContainer();
    }));
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
