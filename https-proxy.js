#!/usr/bin/env node

// server.mjs

import { createServer } from 'https'
import httpProxy from 'http-proxy'
import pem from 'pem'

const createSelfSignedCertificate = () => {
	return new Promise((resolve, reject) => {
		pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
			if (err) reject(err)
			resolve(keys)
		})
	})
}

const showUsage = () => {
	console.log(`
USAGE: node server.mjs [<options>] [TARGET_URL]

	HTTPS proxy server that forwards requests to a target URL.

ARGUMENTS:

	TARGET_URL      The target URL to which the proxy will forward requests.
	                Default is http://localhost:3000/

OPTIONS:
	-h              Show this help screen.
	-p <port>       The port on which the proxy will listen.
`)
}

const startHttpsProxy = (keys, target, port) => {
	const proxy = httpProxy.createProxyServer({})

	createServer(
		{
			key: keys.serviceKey,
			cert: keys.certificate,
		},
		(req, res) => {
			proxy.web(req, res, { target })
		}
	).listen(port, () => {
		console.log(`https://localhost:${port}/ -> ${target}`)
	})
}

const withDefaults = options => {
	return {
		port: 443,
		target: 'http://localhost:3000/',
		...options,
	}
}

const parseArgs = () => {
	const args = process.argv.slice(2)
	const options = {}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		switch (arg) {
			case '-h':
				showUsage()
				process.exit(0)
			case '-p':
				options.port = args[++i]
				break
			default:
				options.target = arg
		}
	}

	return options
}

const init = async () => {
	const { port, target } = withDefaults(parseArgs())

	const keys = await createSelfSignedCertificate()

	startHttpsProxy(keys, target, port)
}

init()
