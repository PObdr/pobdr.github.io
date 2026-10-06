import {catalog,seasons} from './data.js';
import {RuinsGameModel} from './RuinsGameModel.js';
import {GameView} from './GameView.js';
import {GameController} from './GameController.js';
new GameController(new RuinsGameModel(catalog,seasons),new GameView());
