(function () {
	// VERSION 1: for .asm files with NO symbols or labels, only constants
	function assemble (asmProgram) {		
		var assemblerOutput = '';
		var symbolTable = new SymbolTable();
		var ROMcounter = 0;
		var RAMcounter = 16;
		
		// split program into an array of instructions, one per line
		var instructionArray = asmProgram.split('\n');
		
		// first pass identifies labels, adds them to symbol table
		instructionArray.forEach( function (instruction) {								
			instruction = removeWhitespace(instruction);
			instruction = removeComments(instruction);			
			// if this line was empty space or a comment, skip it
			if (instruction === '') {
				return;
			} else if (commandType(instruction) === 'C' || commandType(instruction) === 'A') {
				// increment counter to keep track of ROM addresses
				ROMcounter++;
			} else if (commandType(instruction) === 'L') {
				// add label to symbol table with current ROM address
				symbolTable.addEntry( getSymbol(instruction), ROMcounter );
			}		
		});
		
		// second pass identifies variables, adds them to symbol table, replaces symbols with addresses, and translates operations into machine code
		instructionArray.forEach( function (instruction) {						
			instruction = removeWhitespace(instruction);
			instruction = removeComments(instruction);			
			// if this line was a full-line comment, empty space, or a label, skip it!
			if (instruction === '' || commandType(instruction) === 'L') {
				return;
			} else if (commandType(instruction) === 'A') {				
				var AValue = getSymbol(instruction);				
				if ( !Number.isInteger( parseInt(AValue, 10) )) {
					// if it's a symbol (not a decimal integer), save to symbol table and get its value
					if (!symbolTable.contains(AValue)) {
						// if symbol isn't already in symbol table, add it and increase counter
						symbolTable.addEntry( AValue, RAMcounter);
						RAMcounter++;
					}
					// convert from symbol to address (decimal representation)
					AValue = symbolTable.getAddress(AValue);
				}				
				// convert from decimal to binary representation
				assemblerOutput += getBinary16(AValue) + '\n';		
			} else if (commandType(instruction) === 'C') {
				// convert C-instructions to binary representation
				assemblerOutput += getCInstructMachineCode( operationFields(instruction) ) + '\n';
			}
		});					
		
		function removeWhitespace (str) {
			return str.replace(/\s+/g, '');
		}
		
		function removeComments(str) {
			return str.replace(/\/\/.*$/g, '');
		}
		
		// takes a command, returns A, L or C for instruction types.
		function commandType(str) {
			if (str.charAt(0) === '@') {
				return 'A';
			} else if (str.charAt(0) === '(') {
				return 'L';
			} else {
				return 'C';
			}
		}
		
		// takes an instruction string, returns value of A-instruction or L-instruction
		function getSymbol(str) {
			if (commandType(str) === 'A') {
				return str.slice(1);
			} else if (commandType(str) === 'L'){
				return str.slice(1,-1);
			}
		}
		
		// takes an instruction string, returns object identifying its fields
		function operationFields(str) {
			var fields = {};
			var equalsSplit = str.split(/=/);
			if (equalsSplit.length == 1) {
				// no equal sign, so this is a comp;jump code
				var semicolonSplit = equalsSplit[0].split(/;/);
				fields.comp = semicolonSplit[0];
				fields.jump = semicolonSplit[1];
				fields.dest = null;
			} else if (equalsSplit.length == 2) {
				var semicolonSplit = equalsSplit[1].split(/;/);
				if (semicolonSplit.length == 1) {
					// no semicolon, so this is a dest=comp code
					fields.dest = equalsSplit[0];
					fields.comp = semicolonSplit[0];
					fields.jump = null;
				} else if (semicolonSplit.length == 2) {
					// has equals and semicolon, so this is a dest=comp;jump code
					fields.dest = equalsSplit[0];
					fields.comp = semicolonSplit[0];
					fields.jump = semicolonSplit[1];
				}
				
			}
			return fields;
		}
						
		// takes a mnemonic field from C instruction, returns 3-bit binary code for dest
		function dest(field) {
			var dest = {
				'null': '000',
				'M':    '001',
				'D':    '010',
				'MD':   '011',
				'A':    '100',
				'AM':   '101',
				'AD':   '110',
				'AMD':  '111'
			};
			return dest[field];
		}

		// takes a mnemonic field from C instruction, returns 7-bit binary code for comp
		function comp (field) {
			var comp = {
				'0':    '0101010',
				'1':    '0111111',
				'-1':   '0111010',
				'D':    '0001100',
				'A':    '0110000',
				'!D':   '0001101',
				'!A':   '0110001',
				'-D':   '0001111',
				'-A':   '0110011',
				'D+1':  '0011111',
				'A+1':  '0110111',
				'D-1':  '0001110',
				'A-1':  '0110010',
				'D+A':  '0000010',
				'D-A':  '0010011',
				'A-D':  '0000111',
				'D&A':  '0000000',
				'D|A':  '0010101',
				'M':    '1110000',
				'!M':   '1110001',
				'-M':   '1110011',
				'M+1':  '1110111',
				'M-1':  '1110010',
				'D+M':  '1000010',
				'D-M':  '1010011',
				'M-D':  '1000111',
				'D&M':  '1000000',
				'D|M':  '1010101'        
			};
			return comp[field];
		}

		// takes a mnemonic field from C instruction, returns 3-bit binary code for jump
		function jump (field) {
			var jump = {
				'null': '000',
				'JGT':  '001',
				'JEQ':  '010',
				'JGE':  '011',
				'JLT':  '100',
				'JNE':  '101',
				'JLE':  '110',
				'JMP':  '111'
			};
			return jump[field];
		}
		
		// takes an object containing C-instruction fields, returns full machine code instruction
		function getCInstructMachineCode (fields) {
			var destCode = dest(fields.dest);
			var compCode = comp(fields.comp);
			var jumpCode = jump(fields.jump);
			// append complete C-instruction machine code as a line in the assembler's output string
			return '111' + compCode + destCode + jumpCode;
		}
		
		// takes a string representing a decimal number, returns a string representing a 16-bit binary number
		function getBinary16 (decimalString) {
			var decimalNum = parseInt(decimalString, 10);
			var binaryString = decimalNum.toString(2);
			if (binaryString.length > 16) {
				// if larger than 16 bits in binary, truncate the string
				return binaryString.slice(0,16);
			}
			// pad with leading zeros if needed
			while (binaryString.length < 16) {
				binaryString = '0' + binaryString;
			}
			return binaryString;
		}
		
		// maps symbols to addresses:
		function SymbolTable() {
			// add symbol/address pair
			this.addEntry = function(symbol, address) {
				this[symbol] = address;
			};
			
			// check if symbol is already in the table
			this.contains = function(symbol) {
				if (this.hasOwnProperty(symbol)) {
					return true;
				} else {
					return false;
				}
			};
			
			// return address of given symbol
			this.getAddress = function(symbol) {
				if (this.contains(symbol)) {
					return this[symbol];
				}
			};
			
			// predefined symbols:
			this['SP'] = 0;
			this['LCL'] = 1;
			this['ARG'] = 2;
			this['THIS'] = 3;
			this['THAT'] = 4;
			this['SCREEN'] = 16384;
			this['KBD'] = 24576;
			
			// predefined symbols R0-R15
			for (var i=0;i<=15;i++) {
				this['R'+i] = i;
			}
		}
		
		return assemblerOutput.trim();
		
	}; // end of assembler

	// For converting blob into a downloadable file:
	var textFile = null,
	makeTextFile = function (text) {
		var data = new Blob([text], {type: 'text/plain'});

		// If we are replacing a previously generated file we need to
		// manually revoke the object URL to avoid memory leaks.
		if (textFile !== null) {
		  window.URL.revokeObjectURL(textFile);
		}

		textFile = window.URL.createObjectURL(data);

		return textFile;
	};
	
	// Access HTML elements:
	var create = document.getElementById('create'),
	textbox = document.getElementById('textbox'),
	downloadlink = document.getElementById('downloadlink');

	// When "create" button is clicked, run assembler and generate file and download link:
	create.addEventListener('click', function () {
		// Feed textbox value into the assembler, generate output string
		var assemblerOutput = assemble(textbox.value);

		// Convert assembler's output string into a blob to download as a file:		
		downloadlink.href = makeTextFile(assemblerOutput);
		
		// Display download link, hide create link
		downloadlink.style.display = 'block';
		create.style.display = 'none';
	}, false);
	
	// When link is downloaded, reset buttons:
	downloadlink.addEventListener('click', function () {
		// Display create link, hide download link
		downloadlink.style.display = 'none';
		create.style.display = 'block';
	}, false);
})();
