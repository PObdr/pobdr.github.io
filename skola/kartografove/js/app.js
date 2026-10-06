import {catalog,seasons} from './data.js';
import {GameModel} from './GameModel.js';
import {GameView} from './GameView.js';
import {GameController} from './GameController.js';
const model=new GameModel(catalog,seasons);
const view=new GameView();
new GameController(model,view);
