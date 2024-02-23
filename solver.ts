/**
 * Script to solve chess melee puzzles.
 * Run with:
 * npx ts-node solver.ts
 */

let solutionsCount = 0;
let deadEndCount = 0;

enum PieceType {
    Bishop = 'B',
    King = 'K',
    Knight = 'N',
    Pawn = 'P',
    Queen = 'Q',
    Rook = 'R'
}

enum Color {
    White = 'w',
    Black = 'b'
}

enum MoveType {
    Jump = 0,
    Slide = 1
}

interface Move {
    directionX: number;
    directionY: number;
    type: MoveType;
}

interface Capture {
    attacker: Piece;
    target: Piece;
}

/**
 * Calculate the chess board position string after a move is applied.
 * @param start - The start position.
 * @param move - The move direction to apply.
 * @param multiplier - How often the move direction is repeated.
 * @returns The new position string or null if out of board.
 */
const calculatePosition = ( start: string, move: Move, multiplier: number ): string | null => {
    let x = start.charCodeAt( 0 ) - 96;
    let y = parseInt( start.charAt( 1 ) );
    x += multiplier * move.directionX;
    y += multiplier * move.directionY;
    if ( x < 1 || x > 8 || y < 1 || y > 8 ) {
        return null;
    } else {
        return `${ String.fromCharCode( x + 96 ) }${ y }`;
    }
};

/**
 * Print a sequence of capture moves.
 * @param history - The sequence of capture moves.
 */
const printHistory = ( history: Capture[] ): void => {
    history.forEach( capture => {
        console.log(
`${capture.attacker.type}${capture.attacker.color} ${capture.attacker.position} -> \
${capture.target.type}${capture.target.color} ${capture.target.position}`
        );
    } );
};

/**
 * Class for a chess piece.
 */
class Piece {
    // The move options of this piece.
    public moveOptions: Move[] = [];

    /**
     * Constructor.
     * @param type - The piece type.
     * @param color - The piece color.
     * @param position - The chess board position string.
     */
    constructor(
        public type: PieceType,
        public color: Color,
        public position: string
    ) {
        if ( type === PieceType.Bishop ) {
            this.moveOptions = [
                { directionX: -1, directionY: -1, type: MoveType.Slide },
                { directionX: -1, directionY: 1, type: MoveType.Slide },
                { directionX: 1, directionY: -1, type: MoveType.Slide },
                { directionX: 1, directionY: 1, type: MoveType.Slide }
            ];
        } else if ( type === PieceType.King ) {
            this.moveOptions = [
                { directionX: -1, directionY: -1, type: MoveType.Jump },
                { directionX: -1, directionY: 0, type: MoveType.Jump },
                { directionX: -1, directionY: 1, type: MoveType.Jump },
                { directionX: 0, directionY: -1, type: MoveType.Jump },
                { directionX: 0, directionY: 1, type: MoveType.Jump },
                { directionX: 1, directionY: -1, type: MoveType.Jump },
                { directionX: 1, directionY: 0, type: MoveType.Jump },
                { directionX: 1, directionY: 1, type: MoveType.Jump }
            ];
        } else if ( type === PieceType.Knight ) {
            this.moveOptions = [
                { directionX: -2, directionY: -1, type: MoveType.Jump },
                { directionX: -2, directionY: 1, type: MoveType.Jump },
                { directionX: -1, directionY: -2, type: MoveType.Jump },
                { directionX: -1, directionY: 2, type: MoveType.Jump },
                { directionX: 1, directionY: -2, type: MoveType.Jump },
                { directionX: 1, directionY: 2, type: MoveType.Jump },
                { directionX: 2, directionY: -1, type: MoveType.Jump },
                { directionX: 2, directionY: 1, type: MoveType.Jump }
            ];
        } else if ( type === PieceType.Pawn && color === Color.White ) {
            this.moveOptions = [
                { directionX: -1, directionY: 1, type: MoveType.Jump },
                { directionX: 1, directionY: 1, type: MoveType.Jump }
            ];
        } else if ( type === PieceType.Pawn && color === Color.Black ) {
            this.moveOptions = [
                { directionX: -1, directionY: -1, type: MoveType.Jump },
                { directionX: 1, directionY: -1, type: MoveType.Jump }
            ];
        } else if ( type === PieceType.Queen ) {
            this.moveOptions = [
                { directionX: -1, directionY: -1, type: MoveType.Slide },
                { directionX: -1, directionY: 1, type: MoveType.Slide },
                { directionX: 1, directionY: -1, type: MoveType.Slide },
                { directionX: 1, directionY: 1, type: MoveType.Slide },
                { directionX: -1, directionY: 0, type: MoveType.Slide },
                { directionX: 0, directionY: -1, type: MoveType.Slide },
                { directionX: 0, directionY: 1, type: MoveType.Slide },
                { directionX: 1, directionY: 0, type: MoveType.Slide }
            ];
        } else if ( type === PieceType.Rook ) {
            this.moveOptions = [
                { directionX: -1, directionY: 0, type: MoveType.Slide },
                { directionX: 0, directionY: -1, type: MoveType.Slide },
                { directionX: 0, directionY: 1, type: MoveType.Slide },
                { directionX: 1, directionY: 0, type: MoveType.Slide }
            ];
        }
    }

    /**
     * Create a copy of this piece with the same values.
     * @returns A copy of this piece.
     */
    public clone(): Piece {
        return new Piece( this.type, this.color, this.position );
    }

    /**
     * Get all capture moves that this piece can make on the board.
     * @param board - The current board.
     * @returns A list of capture moves.
     */
    public getPossibleCaptures( board: Board ): Capture[] {
        const captures: Capture[] = [];

        this.moveOptions.forEach( move => {
            if ( move.type === MoveType.Jump ) {
                const newPosition = calculatePosition( this.position, move, 1 );
                if ( newPosition ) {
                    const target = board.findPiece( newPosition );
                    if ( target && target.color !== this.color ) {
                        captures.push( { attacker: this, target: target } );
                    }
                }
            } else if ( move.type === MoveType.Slide ) {
                // A piece can move a maximum of 7 steps in one direction.
                for ( let i = 1; i <= 7; i++ ) {
                    const newPosition = calculatePosition( this.position, move, i );
                    if ( newPosition ) {
                        const target = board.findPiece( newPosition );
                        if ( target ) {
                            if ( target.color !== this.color ) {
                                captures.push( { attacker: this, target: target } );
                            }
                            // Else the next piece in this direction is of the same color.
                            // Stop loop to stop the slide.
                            break;
                        }
                    }
                }
            }
        } );

        return captures;
    }
}

/**
 * Class for the chess board.
 */
class Board {
    // The pieces on the board.
    public pieces: Piece[] = [];

    /**
     * Find the piece at a given position.
     * @param position - The position to look up.
     * @returns The piece or null.
     */
    public findPiece( position: string ): Piece | null {
        let result = null;
        this.pieces.forEach( piece => {
            if ( piece.position === position ) {
                result = piece;
            }
        } );
        return result;
    }

    /**
     * Create a copy of the board with the same pieces.
     * @returns A copy of the board.
     */
    public clone(): Board {
        const newBoard = new Board();
        newBoard.pieces = this.pieces.map( piece => piece.clone() );
        return newBoard;
    }

    /**
     * Apply a capture move on the board.
     * @param capture - The capture to apply.
     * @returns Whether the action was successful.
     */
    public applyCapture( capture: Capture ): boolean {
        const initialAmount = this.pieces.length;

        // Remove the target piece.
        for ( let i = 0; i < this.pieces.length; i++ ) {
            if ( this.pieces[ i ].position === capture.target.position ) {
                this.pieces.splice( i, 1 );
                break;
            }
        }

        // Set position on the attacker piece.
        this.pieces.forEach( piece => {
            if ( piece.position === capture.attacker.position ) {
                piece.position = capture.target.position;
            }
        } );

        return ( this.pieces.length === ( initialAmount - 1 ) );
    }

    /**
     * Solve the puzzle board.
     */
    public solve(): void {
        this.solveRecursive( [], Color.White );
    }

    /**
     * Recursively solve the puzzle board.
     * @param history - The current history of captures.
     * @param turnColor - The color whose turn it is.
     */
    public solveRecursive( history: Capture[], turnColor: Color ): void {
        if ( this.pieces.length === 1 ) {
            console.log( 'Solved' );
            printHistory( history );
            solutionsCount += 1;
        } else {
            let movePossible = false;
            this.pieces.forEach( piece => {
                if ( piece.color === turnColor ) {
                    const captures = piece.getPossibleCaptures( this );
                    if ( captures.length > 0 ) {
                        movePossible = true;
                    }

                    captures.forEach( capture => {
                        const newBoard = this.clone();
                        const result = newBoard.applyCapture( capture );
                        // Only continue if capture was successful.
                        if ( result ) {
                            const nextColor = ( turnColor === Color.White ) ? Color.Black : Color.White;
                            newBoard.solveRecursive( [ ...history, capture ], nextColor );
                        } else {
                            console.log( 'Move failed' );
                        }
                    } );
                }
            } );
            if ( !movePossible ) {
                deadEndCount += 1;
            }
        }
    }
}

const board = new Board();
board.pieces = [
    new Piece( PieceType.Bishop, Color.Black, 'e4' ),
    new Piece( PieceType.Bishop, Color.Black, 'f2' ),
    new Piece( PieceType.Bishop, Color.White, 'f3' ),
    new Piece( PieceType.Knight, Color.White, 'd6' ),
    new Piece( PieceType.Knight, Color.White, 'f7' ),
    new Piece( PieceType.Knight, Color.Black, 'g3' ),
    new Piece( PieceType.Pawn, Color.White, 'd3' ),
    new Piece( PieceType.Pawn, Color.Black, 'e5' ),
    new Piece( PieceType.Pawn, Color.White, 'g2' ),
    new Piece( PieceType.Pawn, Color.Black, 'h3' ),
    new Piece( PieceType.Queen, Color.Black, 'c2' ),
    new Piece( PieceType.Rook, Color.White, 'g1' )
];
board.solve();

console.log( 'Solutions:', solutionsCount );
console.log( 'Dead ends:', deadEndCount );
