// ===========================
// UI Controller
// ===========================

let game;
let selectedSquare = null;
let validMoves = [];
let hintVisible = false;

// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    game = new ChessGame();
    simpleAI = new SimpleChessAI();
    chessEngine = new ChessEngine();
    renderBoard();
    updateUI();
    attachEventListeners();
    
    // Initialize piece style selector
    const pieceStyleSelector = document.getElementById('piece-style');
    if (pieceStyleSelector) {
        pieceStyleSelector.value = currentPieceStyle;
    }
    
    // Don't auto-start analysis - let user enable it manually
    chessEngine.updateStatus('AI Analysis OFF');
});

function renderBoard() {
    const boardElement = document.getElementById('chess-board');
    boardElement.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = game.getPiece(row, col);
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = PIECES[piece.color][piece.type];
                pieceElement.draggable = piece.color === game.currentTurn;
                square.appendChild(pieceElement);
            }

            // Click event
            square.addEventListener('click', handleSquareClick);

            // Drag events (desktop)
            square.addEventListener('dragstart', handleDragStart);
            square.addEventListener('dragover', handleDragOver);
            square.addEventListener('drop', handleDrop);
            square.addEventListener('dragenter', handleDragEnter);
            square.addEventListener('dragleave', handleDragLeave);

            // Touch events (mobile)
            square.addEventListener('touchstart', handleTouchStart, { passive: false });
            square.addEventListener('touchmove', handleTouchMove, { passive: false });
            square.addEventListener('touchend', handleTouchEnd, { passive: false });
            square.addEventListener('touchcancel', handleTouchCancel);

            boardElement.appendChild(square);
        }
    }

    // Highlight king in check
    if (game.gameStatus === 'check' || game.gameStatus === 'checkmate') {
        const kingPos = game.findKing(game.currentTurn);
        if (kingPos) {
            const kingSquare = getSquareElement(kingPos.row, kingPos.col);
            kingSquare.classList.add('in-check');
        }
    }
}

function handleSquareClick(e) {
    if (game.gameStatus === 'checkmate' || game.gameStatus === 'stalemate') return;

    const square = e.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedSquare) {
        // Try to make a move
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;

        if (fromRow === row && fromCol === col) {
            // Deselect
            clearSelection();
        } else {
            attemptMove(fromRow, fromCol, row, col);
        }
    } else {
        // Select a piece
        const piece = game.getPiece(row, col);
        if (piece && piece.color === game.currentTurn) {
            selectSquare(row, col);
        }
    }
}

function selectSquare(row, col) {
    clearSelection();
    
    selectedSquare = { row, col };
    validMoves = game.getValidMoves(row, col);

    // Highlight selected square
    const square = getSquareElement(row, col);
    square.classList.add('selected');

    // Highlight valid moves
    validMoves.forEach(move => {
        const targetSquare = getSquareElement(move.row, move.col);
        targetSquare.classList.add('valid-move');
        
        const hasPiece = game.getPiece(move.row, move.col);
        if (hasPiece) {
            targetSquare.classList.add('has-piece');
        }
    });
}

function clearSelection() {
    selectedSquare = null;
    validMoves = [];

    document.querySelectorAll('.square.selected').forEach(sq => {
        sq.classList.remove('selected');
    });
    document.querySelectorAll('.square.valid-move').forEach(sq => {
        sq.classList.remove('valid-move', 'has-piece');
    });
}

function attemptMove(fromRow, fromCol, toRow, toCol) {
    const result = game.makeMove(fromRow, fromCol, toRow, toCol);

    if (result === 'promotion') {
        showPromotionDialog(toRow, toCol);
    } else if (result) {
        clearSelection();
        renderBoard();
        updateUI();
        
        // Trigger analysis after move only if hint is enabled
        if (hintVisible) {
            setTimeout(() => analyzePosition(), 300);
        }
    }
}

// Drag and Drop handlers
let draggedPiece = null;

function handleDragStart(e) {
    if (game.gameStatus === 'checkmate' || game.gameStatus === 'stalemate') {
        e.preventDefault();
        return;
    }

    const square = e.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = game.getPiece(row, col);

    if (!piece || piece.color !== game.currentTurn) {
        e.preventDefault();
        return;
    }

    draggedPiece = { row, col };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${row},${col}`);

    // Add visual feedback
    setTimeout(() => {
        square.style.opacity = '0.5';
    }, 0);

    // Show valid moves
    selectSquare(row, col);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    const square = e.currentTarget;
    if (square.classList.contains('valid-move')) {
        square.classList.add('dragging-over');
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragging-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging-over');

    if (!draggedPiece) return;

    const toSquare = e.currentTarget;
    const toRow = parseInt(toSquare.dataset.row);
    const toCol = parseInt(toSquare.dataset.col);

    // Reset opacity
    const fromSquare = getSquareElement(draggedPiece.row, draggedPiece.col);
    fromSquare.style.opacity = '1';

    attemptMove(draggedPiece.row, draggedPiece.col, toRow, toCol);
    draggedPiece = null;
}

// Touch support for mobile devices
let touchStartSquare = null;
let touchStartTime = 0;

function handleTouchStart(e) {
    if (game.gameStatus === 'checkmate' || game.gameStatus === 'stalemate') return;

    const square = e.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = game.getPiece(row, col);

    // Only handle touches on pieces of the current player
    if (piece && piece.color === game.currentTurn) {
        e.preventDefault(); // Prevent default to avoid conflicts
        touchStartSquare = { row, col, element: square };
        touchStartTime = Date.now();
        
        // Visual feedback
        square.style.opacity = '0.7';
        square.style.transform = 'scale(1.05)';
        
        // Show valid moves
        selectSquare(row, col);
    }
}

function handleTouchMove(e) {
    if (!touchStartSquare) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Remove dragging-over class from all squares
    document.querySelectorAll('.dragging-over').forEach(sq => {
        sq.classList.remove('dragging-over');
    });

    // Add dragging-over class to current square if it's valid
    if (elementAtPoint && elementAtPoint.classList.contains('square')) {
        if (elementAtPoint.classList.contains('valid-move')) {
            elementAtPoint.classList.add('dragging-over');
        }
    }
}

function handleTouchEnd(e) {
    if (!touchStartSquare) return;
    
    e.preventDefault();
    
    const touchDuration = Date.now() - touchStartTime;
    const touch = e.changedTouches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);

    // Reset visual feedback
    touchStartSquare.element.style.opacity = '1';
    touchStartSquare.element.style.transform = 'scale(1)';
    
    // Remove dragging-over class
    document.querySelectorAll('.dragging-over').forEach(sq => {
        sq.classList.remove('dragging-over');
    });

    // If touch was very short and on the same piece, treat as selection (already done)
    // If moved to another square, attempt the move
    if (elementAtPoint && elementAtPoint.classList.contains('square')) {
        const toRow = parseInt(elementAtPoint.dataset.row);
        const toCol = parseInt(elementAtPoint.dataset.col);
        
        // If different square, try to move
        if (toRow !== touchStartSquare.row || toCol !== touchStartSquare.col) {
            attemptMove(touchStartSquare.row, touchStartSquare.col, toRow, toCol);
        }
    }

    touchStartSquare = null;
}

function handleTouchCancel(e) {
    if (touchStartSquare) {
        touchStartSquare.element.style.opacity = '1';
        touchStartSquare.element.style.transform = 'scale(1)';
        touchStartSquare = null;
    }
    
    document.querySelectorAll('.dragging-over').forEach(sq => {
        sq.classList.remove('dragging-over');
    });
}

// Promotion Dialog
function showPromotionDialog(row, col) {
    const modal = document.getElementById('promotion-modal');
    const choicesContainer = document.getElementById('promotion-choices');
    const color = game.getPiece(row, col).color;

    choicesContainer.innerHTML = '';

    const pieceTypes = ['queen', 'rook', 'bishop', 'knight'];
    pieceTypes.forEach(type => {
        const choice = document.createElement('div');
        choice.className = `promotion-choice piece ${color}`;
        choice.textContent = PIECES[color][type];
        choice.addEventListener('click', () => {
            game.promotePawn(row, col, type);
            modal.classList.remove('active');
            clearSelection();
            renderBoard();
            updateUI();
        });
        choicesContainer.appendChild(choice);
    });

    modal.classList.add('active');
}

// UI Update Functions
function updateUI() {
    updateTurnIndicator();
    updateGameStatus();
    updateCapturedPieces();
    updateMoveHistory();
    updateMoveCount();
    updateUndoButton();
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    const turnText = indicator.querySelector('.turn-text');
    
    turnText.textContent = `${game.currentTurn === 'white' ? 'White' : 'Black'}'s Turn`;
    
    indicator.classList.remove('white-turn', 'black-turn');
    indicator.classList.add(`${game.currentTurn}-turn`);
}

function updateGameStatus() {
    const statusElement = document.getElementById('game-status');
    statusElement.className = 'game-status';
    
    switch (game.gameStatus) {
        case 'check':
            statusElement.textContent = `${game.currentTurn === 'white' ? 'White' : 'Black'} is in Check!`;
            statusElement.classList.add('check');
            break;
        case 'checkmate':
            const winner = game.currentTurn === 'white' ? 'Black' : 'White';
            statusElement.textContent = `Checkmate! ${winner} Wins! 🎉`;
            statusElement.classList.add('checkmate');
            break;
        case 'stalemate':
            statusElement.textContent = 'Stalemate! It\'s a Draw!';
            statusElement.classList.add('stalemate');
            break;
        default:
            statusElement.textContent = '';
    }
}

function updateCapturedPieces() {
    const whiteContainer = document.getElementById('captured-white');
    const blackContainer = document.getElementById('captured-black');

    whiteContainer.innerHTML = game.capturedPieces.white
        .map(type => `<span class="captured-piece black">${PIECES.black[type]}</span>`)
        .join('');
    
    blackContainer.innerHTML = game.capturedPieces.black
        .map(type => `<span class="captured-piece white">${PIECES.white[type]}</span>`)
        .join('');
}

function updateMoveHistory() {
    const historyElement = document.getElementById('move-history');
    
    const moves = game.moveHistory.map((move, index) => {
        const moveNum = Math.floor(index / 2) + 1;
        const isWhite = index % 2 === 0;
        
        if (isWhite) {
            return `<div class="move-entry">${moveNum}. ${move.notation}</div>`;
        } else {
            // Update previous entry to include black's move
            const entries = historyElement.querySelectorAll('.move-entry');
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                lastEntry.textContent += ` ${move.notation}`;
                return '';
            }
        }
    }).join('');

    if (game.moveHistory.length % 2 === 1) {
        historyElement.innerHTML = moves;
    } else if (moves) {
        historyElement.innerHTML = moves;
    }

    // Auto-scroll to bottom
    historyElement.scrollTop = historyElement.scrollHeight;
}

function updateMoveCount() {
    const moveCount = Math.floor(game.moveHistory.length / 2);
    document.getElementById('move-count').textContent = moveCount;
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undo-btn');
    const undoBtnSide = document.getElementById('undo-btn-side');
    const isDisabled = game.moveHistory.length === 0;
    
    if (undoBtn) undoBtn.disabled = isDisabled;
    if (undoBtnSide) undoBtnSide.disabled = isDisabled;
}

// Event Listeners
function attachEventListeners() {
    // Bottom controls (always present)
    document.getElementById('new-game-btn').addEventListener('click', handleNewGame);
    document.getElementById('undo-btn').addEventListener('click', handleUndo);

    // Side panel controls (desktop only)
    const newGameBtnSide = document.getElementById('new-game-btn-side');
    const undoBtnSide = document.getElementById('undo-btn-side');
    
    if (newGameBtnSide) newGameBtnSide.addEventListener('click', handleNewGame);
    if (undoBtnSide) undoBtnSide.addEventListener('click', handleUndo);

    // AI Analysis toggle switch
    const hintToggle = document.getElementById('hint-toggle');
    const analysisStatus = document.getElementById('analysis-status');
    
    hintToggle.addEventListener('change', () => {
        if (hintToggle.checked) {
            // Turn ON AI Analysis
            hintVisible = true;
            analysisStatus.textContent = 'AI Analysis ON';
            if (chessEngine && !chessEngine.isAnalyzing) {
                analyzePosition();
            }
        } else {
            // Turn OFF AI Analysis
            hintVisible = false;
            analysisStatus.textContent = 'AI Analysis OFF';
            
            // Clear display and highlights
            const display = document.getElementById('best-move-display');
            display.innerHTML = '';
            document.querySelectorAll('.best-move-highlight').forEach(sq => {
                sq.classList.remove('best-move-highlight');
            });
        }
    });

    // Piece style selector
    const pieceStyleSelector = document.getElementById('piece-style');
    if (pieceStyleSelector) {
        pieceStyleSelector.addEventListener('change', (e) => {
            if (changePieceStyle(e.target.value)) {
                renderBoard();
            }
        });
    }

    // Apply hint button (dynamic - attached when hint is shown)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'apply-hint-btn') {
            const display = document.getElementById('best-move-display');
            const fromRow = parseInt(display.dataset.fromRow);
            const fromCol = parseInt(display.dataset.fromCol);
            const toRow = parseInt(display.dataset.toRow);
            const toCol = parseInt(display.dataset.toCol);
            
            attemptMove(fromRow, fromCol, toRow, toCol);
        }
    });
}

function handleNewGame() {
    if (confirm('Start a new game?')) {
        game.reset();
        clearSelection();
        renderBoard();
        updateUI();
        resetHintButton();
        
        // Don't auto-analyze on new game unless hint is enabled
        if (hintVisible) {
            setTimeout(() => analyzePosition(), 500);
        }
    }
}

function handleUndo() {
    if (game.undoMove()) {
        clearSelection();
        renderBoard();
        updateUI();
        
        // Re-analyze only if hint is enabled
        if (hintVisible) {
            setTimeout(() => analyzePosition(), 300);
        }
    }
}

// Helper Functions
function getSquareElement(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function resetHintButton() {
    const hintToggle = document.getElementById('hint-toggle');
    const display = document.getElementById('best-move-display');
    const analysisStatus = document.getElementById('analysis-status');
    
    if (hintToggle) {
        hintToggle.checked = false;
        hintVisible = false;
    }
    
    if (display) {
        display.innerHTML = '';
    }
    
    if (analysisStatus) {
        analysisStatus.textContent = 'AI Analysis OFF';
    }
    
    // Clear best move highlights
    document.querySelectorAll('.best-move-highlight').forEach(sq => {
        sq.classList.remove('best-move-highlight');
    });
}

// Prevent default drag behavior on pieces
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

// Analysis Functions
function analyzePosition() {
    if (!chessEngine || !chessEngine.isReady) return;
    
    // Clear best move highlights
    document.querySelectorAll('.best-move-highlight').forEach(sq => {
        sq.classList.remove('best-move-highlight');
    });
    
    chessEngine.analyzePosition(game);
}
