#!/usr/bin/env node

/*
# echo $List | awk '{print $2}'
nasm -f elf ./kernel/arch/i386/boot.asm -o ./bin/boot.o

for i in $(seq 1 $end); do 
	ta=$(echo ./bin/$(basename $(echo $objects | cut -d" " -f$i )))
	tb=$(echo $sources | cut -d" " -f$i)
	objb="${objb} ${ta}"
	gcc -m32 -elf_i386 -Wall -O -fstrength-reduce -fomit-frame-pointer -finline-functions -nostdinc -fno-builtin -I./kernel/modules/include -fno-stack-protector -c -o $ta $tb
done
objb="${objb:1}"
ld -T link.ld -m elf_i386 -o os.bin $objb ./bin/boot.o
rm -r iso
mkdir iso
mkdir iso/boot
mkdir iso/boot/grub
mv os.bin iso/boot/os.bin
#./initrdgen helloworld.c helloworld.c
echo 'set timeout-0' >> iso/boot/grub/grub.cfg
echo 'set default-0' >> iso/boot/grub/grub.cfg
echo 'menuentry "abrid" {' >> iso/boot/grub/grub.cfg
echo '  multiboot /boot/os.bin' >> iso/boot/grub/grub.cfg
echo '  module  /boot/os.initrd' >> iso/boot/grub/grub.cfg
echo '  boot' >> iso/boot/grub/grub.cfg
echo '}' >> iso/boot/grub/grub.cfg
rm initrdgen
gcc initrdgen.c -o initrdgen
inp="./readme ${sources} ${headers}"
res=""
for word in $inp
do
    res="${res} ${word} ${word}"
done
./initrdgen $res
mv ./initrd.img ./iso/boot/os.initrd
grub-mkrescue --output=os.iso iso
#qemu-system-i386 -kernel os.bin -initrd initrd.img -hda floppy.img -m 128M -machine type=pc-i440fx-3.1
qemu-system-i386 -cdrom os.iso -m 256M -hda floppy.img
*/

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
