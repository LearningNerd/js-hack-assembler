(function () {
	// VERSION 1: for .asm files with NO symbols or labels, only constants
	function assemble (asmProgram) {
		
		var assemblerOutputArray = [];
		var instructionArray = asmProgram.split('\n');
		
		instructionArray.forEach( function (instruction) {
			// do stuff to parse and translate here!
		});
		
		var parser = {};

		parser.commandType = function(str) {
			// takes an instruction string, returns A, C, or L for command types
		};
		
		parser.symbol = function(str) {
			// takes an instruction string, returns symbol/decimal number of A or L
		};
		
		parser.dest = function(str) {
			// takes an instruction string, returns 1 of 8 dest mnemonic strings from C
		};
		
		parser.comp = function(str) {
			// takes an instruction string, returns 1 of 28 comp mnemonic strings from C
		};
		
		parser.jump = function(str) {
			// takes an instruction string, returns 1 of 8 jump mnemonic strings from C
		};
		
		var translator = {};
		
		translator.dest = function(field) {
			// takes a mnemonic field from C instruction, returns 3-bit binary code for dest
		};
		
		translator.comp = function(field) {
			// takes a mnemonic field from C instruction, returns 7-bit binary code for comp
		};
		
		translator.jump = function(field) {
			// takes a mnemonic field from C instruction, returns 3-bit binary code for jump
		};
		
		return asmProgram; // need to change this to output newly generated machine code instead!
		
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
	
	// When links is downloaded, reset buttons:
	downloadlink.addEventListener('click', function () {
		// Display create link, hide download link
		downloadlink.style.display = 'none';
		create.style.display = 'block';
	}, false);
})();
