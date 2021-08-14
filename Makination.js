#!/usr/bin/env node
var VARIABLES = {};

function parse(contents) {
	var result = [];
	var lines = contents.split("\n");
	lines.forEach((l) => {
		var tokens = l.split(" ");
		if(tokens[0].match(/[A-Za-z_]/g) && tokens[1] == "p=") {
			var innerTokens = tokens.slice(2);
			result.push(`${tokens[0]}=${parse(innerTokens.join(" "))}`);
		} else if(tokens[0].match(/[A-Za-z_]/g) && tokens[1] == "=") {
			var innerTokens = tokens.slice(2);
			result.push(`${tokens[0]}=${innerTokens.join(" ")}`);
		} else if(tokens[0] == "FGET") {
			result.push(`\$(find ${tokens[1]} -type f -name "${tokens[2]}")`);
		} else if(tokens[0] == "COMMAND") {
			result.push(tokens.slice(1).join(" "));
		} else if(tokens[0] == "REPLACEVAR") {
			result.push(`\$(echo \${${tokens[1]}//${tokens[2]}/${tokens[3]}})`);
		} else if(tokens[1] == "AWK") {
			result.push(`awk ${tokens.slice(1).join(" ")}`);
		} else if(tokens[0] == "VARAWK") {
			result.push(`\$(awk ${tokens.slice(1).join(" ")})`);
		} else if(tokens[0].match(/[A-Za-z_]\+\+/g)) {
			result.push(`${tokens[0].replace(/\+\+/g, "")}=\$((${tokens[0].replace("++", "")}+1))`);
		} else if(tokens[0] == "FORRANGE") {
			if(tokens[3] == undefined) {
				result.push(`for ${tokens[1]} in \$(seq \$${tokens[2]}); do `);
			} else {
				result.push(`for ${tokens[1]} in \$(seq ${tokens[2]} ${tokens[3]}); do `);
			}
		} else if(tokens[0] == "FORIN") {
			result.push(`for ${tokens[1]} in ${tokens[2]}; do`);
		} else if(l == "DONE") {
			result.push("done");
		} else if(tokens[0] == "FAPPEND") {
			result.push(`echo '${tokens.slice(2).join(" ")}' >> ${tokens[1]}`);
		} else if(tokens[0] == "MKDIR") {
			result.push(`mkdir ${tokens.slice(1).join(" ")}`);
		} else if(tokens[0] == "RM") {
			result.push(`rm ${tokens.slice(1).join(" ")}`);
		} else if(tokens[0] == "MV") {
			result.push(`mv ${tokens.slice(1).join(" ")}`);
		} else if(tokens[0] == "ECHO") {
			result.push(`echo ${l.slice(5)}`);
		} else if(tokens[0] == "BLANK") {
			result.push(`${tokens[1]}=''`);	
		} else if(tokens[0] == "ASSIGNCMD") {
			result.push(`${tokens[1]}=\$(${tokens.slice(2).join(" ")})`);	
		} else if(tokens[0] == "APPEND") {
			result.push(`${tokens[1]}="\${${tokens[1]}} \${${tokens[2]}}"`)
		} else if(l == "" || tokens[0] == "//") {

		} else {
			console.error("unknown command:\n" + l);
		}
	});
	return result;
}

const fs = require('fs');
fs.readFile(process.argv[2], 'utf8', function (err,data) {
	if (err) return console.error(err);
	if(process.argv[3] == "-o") {
		fs.writeFile(process.argv[4], parse(data).join("\n"), function (err) {
			if (err) console.error(err);
		});
		process.argv[4]
	} else {
		console.log(parse(data).join("\n"));
	}
});
