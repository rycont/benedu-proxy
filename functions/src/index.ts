import * as functions from 'firebase-functions';
import login from 'benedu-nodejs/dist/auth/getUserToken'
import _getTaskExamList from 'benedu-nodejs/dist/exam/getTaskExamList'
import _getCreatedExam from 'benedu-nodejs/dist/exam/getCreatedExam'
import { setFetch } from 'benedu-nodejs/dist/api'
import fetch from 'node-fetch'

setFetch(fetch)
const shouldAuth = (controller: (req: functions.https.Request, resp: functions.Response, additional?: any) => any) => (req: functions.https.Request, res: functions.Response, additional?: any) => {
    const token = req.header('Authorization')

    if (token?.length === 24)
        return controller(req, res, {
            ...additional,
            token
        })
    return res.status(401).json({
        error: 401,
        message: 'Invaild Authorization Token'
    })
}

const shouldKey = (controller: (req: functions.https.Request, resp: functions.Response, additional?: any) => any) => (req: functions.https.Request, res: functions.Response, additional?: any) => {
    const parsedBody = typeof req.body === 'object' ? req.body : JSON.parse(req.body)
    if (!parsedBody) res.status(400).json({
        error: 400,
        message: `Invaild Request`
    })

    const getKey = (key: string): string | null => {
        if (parsedBody[key]) return parsedBody[key]
        res.status(400).json({
            error: 400,
            message: `key "${key}" not found on body`
        })
        return null
    }
    return controller(req, res, {
        ...additional,
        getKey
    })
}

const cors = (controller: (req: functions.https.Request, resp: functions.Response) => any) => (req: functions.https.Request, res: functions.Response) => {
    res.set("Access-Control-Allow-Origin", "*");
    return controller(req, res)
}

export const auth = functions.https.onRequest(cors(shouldKey(async (request, response, { getKey }) => {
    const username = getKey('username')
    const password = getKey('password')
    if (!(username && password)) return;
    response.json({
        token:
            await login({
                username,
                password
            })
    })
})));

export const getTaskExamList = functions.https.onRequest(cors(shouldAuth(shouldKey(async (req, res, additional) => {
    res.json(await _getTaskExamList({
        providedToken: additional.token
    }))
}))))

export const getCreatedExam = functions.https.onRequest(cors(shouldAuth(shouldKey(async (req, res, additional) => {
    return res.json(await _getCreatedExam({
        providedToken: additional.token
    }));
}))))