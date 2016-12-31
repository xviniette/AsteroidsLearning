var loadJson = function() {
	var files = document.getElementById('json').files;
	if (!files.length) {
		alert('Please select a file!');
		return;
	}
	var file = files[0];

	var reader = new FileReader();

	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) {
			var neuvol = eval('('+ evt.target.result +')');

			//load Neuroevolution
			Neuvol = new Neuroevolution(neuvol.options);

			//reseting the game
			clearTimeout(timeout);
			window.onload();
		}
	};

	var blob = file.slice(0, file.size);
	reader.readAsBinaryString(blob);
}

var saveJson = function(){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Neuvol));
	var dlAnchorElem = document.getElementById('downloadJson');
	dlAnchorElem.setAttribute("href",     dataStr     );
	dlAnchorElem.setAttribute("download", "Neuvol.json");
	dlAnchorElem.click();
}
