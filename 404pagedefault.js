module.exports = (websiteTitle) => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${websiteTitle} - 404 Not Found</title>
	<link href="https://fonts.googleapis.com/css?family=Nunito:400,700" rel="stylesheet">
	<link type="text/css" rel="stylesheet" href="https://assistants.ga/404publicstyle.css" />
	<!--[if lt IE 9]>
		  <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
		  <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
		<![endif]-->

</head>

<body>

	<div id="notfound">
		<div class="notfound">
			<div class="notfound-404"></div>
			<h1>404</h1>
			<h2>Oops! Error 404 Page Not Found</h2>
			<p>Sorry but the page you are looking for does not exist, have been removed. name changed or is temporarily unavailable</p>
			<a href="/">Back to homepage</a>
		</div>
	</div>

</body>

</html>
`;