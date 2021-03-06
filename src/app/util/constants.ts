import { environment } from '../../environments/environment';
let host = '192.168.1.2:8080';
let videoChatServer = 'https://localhost:8000/';
videoChatServer = 'https://checkers-server.aronkageza.com:8000/';
let wsProtocol = 'ws';
if (environment.production) {
  host = 'checkers-server.aronkageza.com:8443';
  videoChatServer = 'https://checkers-server.aronkageza.com:8000/';
  wsProtocol = 'wss';
}
export const HOST = host;
export const VIDEO_CHAT_SERVER = videoChatServer;
export const WS_PROTOCOL = wsProtocol;
export const MAX_CALL_RETRIES = 4;

export const ACTION_REGISTER = 1;
export const ACTION_LOGIN = 2;
export const ACTION_CHAT = 3;
export const ACTION_PLAY = 4;
export const ACTION_JOIN = 5;
export const ACTION_LEAVE = 6;
export const ACTION_RESTART = 7;
export const ACTION_CREATE = 8;
export const ACTION_ERROR = 9;
export const ACTION_CONNECT = 10;
export const ACTION_OTHER_CONNECT = 11;
export const ACTION_INFO = 12;
export const ACTION_CLOSED = 13;
export const ACTION_STATE = 14;
export const ACTION_OVER = 15;
export const ACTION_OTHER_CLOSED = 16;
export const ACTION_OTHER_JOINED = 17;
export const ACTION_RULE_UPDATED = 18;
export const ACTION_ACCEPT = 19;

export const OFFSET_X_ATTR = "xOffset";
export const OFFSET_Y_ATTR = "yOffset";
export const ROW_ATTRIBUTE = "row";
export const COL_ATTRIBUTE = "col";
export const PIECE_EDGE_OFFSET = 10;
export const ANIMATION_TIME = 1000;
export const ANIMATION_DELAY = 300;
export const NUMBER_OF_FRAMES = 100;


// piece types
export const TYPE_NORMAL = 1;
export const TYPE_KING = 2;

// player ids
export const CREATOR_ID = 1;
export const JOINER_ID = -1;

// colors
export const CREATOR_COLOR = "black";
export const JOINER_COLOR = "#00b0ff";