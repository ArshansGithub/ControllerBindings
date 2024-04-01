
// function resolvePath(obj, path){
//     const splitted = path.split(".")
//     let toReturn = mappings;

//     splitted.forEach(element => {
//         toReturn = toReturn[element]
//     });

//     return toReturn
// }

// const mappings = {
//     "m_DriverController": { defaultcommands: { "swerveSubsystem": ["leftX"] }, buttons: { "a": ["deployIntake"] }, dpad: { "90": ["setAngle"] }, joystick: ["xAxis"] },
//     "m_OperatorController": { defaultcommands: { "armSubsystem": [] }, buttons: { "a": ["angleArm"] }, dpad: { "90": ["setAngle"] } },
//     // Add more mappings as needed
// };

// console.log(resolvePath(mappings, "m_DriverController.dpad"))

const fs = require('fs');
const toLookFor = ["XboxController .*"]
const variableNames = [];

fs.readFile('sim.txt', 'utf-8', (err, data) => {
    if (err) throw err;
    data.split("\n").forEach(line => {
      if (line.match(toLookFor[0])) {
        if (line.includes("=")) {
          variableNames.push(line.split("XboxController")[1].split("=")[0].trim())
        } else {
          variableNames.push(line.split("XboxController")[1].replace(";", ""));
        }
    
      }
      //console.log(variableNames)
  });
  data.split("\n").forEach(line => {
    variableNames.forEach(toCheck => {
      if (line.includes(toCheck + ".") && 
          !line.includes(`() -> ${toCheck}`) && 
          !line.includes(`() -> -${toCheck}`) && 
          !line.trim().startsWith("//")
      ) {
        let command = line.split(".");
        command.forEach(element => {
          console.log("command " + element)
        });
        //console.log(command)
      }
    })
})
  });

