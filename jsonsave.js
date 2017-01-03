var loadJson = function() {
	var files = document.getElementById('json').files;
	if (!files.length) {
		alert('select a file first.');
		document.getElementById('json').click();
		return;
	}
	var file = files[0];

	var reader = new FileReader();

	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) {
			var fContent = JSON.parse( evt.target.result );

			//load Neuroevolution
			Neuvol = new Neuroevolution(fContent[0].options, fContent[0].generations);

			//reseting the game
			clearTimeout(timeout);
			window.onload(fContent[1]);
		}
	};

	var blob = file.slice(0, file.size);
	reader.readAsBinaryString(blob);
}

var saveJson = function(){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([ Neuvol, game.generation ]));
	var dlAnchorElem = document.getElementById('downloadJson');
	dlAnchorElem.setAttribute("href",     dataStr     );
	dlAnchorElem.setAttribute("download", "Neuvol.json");
	dlAnchorElem.click();
}
