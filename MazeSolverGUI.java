import java.awt.*;
import javax.swing.*;
import java.util.*;

public class MazeSolverGUI extends JFrame {
    private static final int CELL_SIZE = 40;
    private static final int ROWS = 15;
    private static final int COLS = 15;

    private char[][] maze;         // The maze grid
    private boolean[][] visited;   // For DFS solving only

    private MazePanel mazePanel;
    private JButton solveButton, regenerateButton;
    private volatile boolean solving = false;

    public MazeSolverGUI() {
        setTitle("Maze Solver (DFS)");
        setSize(COLS * CELL_SIZE + 20, ROWS * CELL_SIZE + 100);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        mazePanel = new MazePanel();
        add(mazePanel, BorderLayout.CENTER);

        solveButton = new JButton("Solve Maze");
        regenerateButton = new JButton("Regenerate Maze");

        solveButton.addActionListener(e -> {
            if (!solving) {
                int[] start = findStart();
                if (start != null) {
                    solving = true;
                    visited = new boolean[ROWS][COLS]; // Reset visited for solving
                    new Thread(() -> {
                        dfs(start[0], start[1]);
                        solving = false;
                    }).start();
                }
            }
        });

        regenerateButton.addActionListener(e -> {
            if (!solving) {
                generateMaze();
                mazePanel.repaint();
            }
        });

        JPanel panel = new JPanel();
        panel.add(solveButton);
        panel.add(regenerateButton);
        add(panel, BorderLayout.SOUTH);

        generateMaze(); // Initial maze generation
    }

    private void generateMaze() {
        maze = new char[ROWS][COLS];
        boolean[][] generationVisited = new boolean[ROWS][COLS]; // for maze carving only

        for (int r = 0; r < ROWS; r++)
            Arrays.fill(maze[r], '#');

        carveMaze(1, 1, generationVisited);
        maze[1][1] = 'S';
        maze[ROWS - 2][COLS - 2] = 'E';
    }

    private void carveMaze(int r, int c, boolean[][] genVisited) {
        genVisited[r][c] = true;
        maze[r][c] = ' ';
        Integer[] dirs = {0, 1, 2, 3}; // N, S, W, E
        Collections.shuffle(Arrays.asList(dirs));
        for (int d : dirs) {
            int dr = (d == 0 ? -1 : d == 1 ? 1 : 0);
            int dc = (d == 2 ? -1 : d == 3 ? 1 : 0);
            int nr = r + dr * 2, nc = c + dc * 2;
            if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && !genVisited[nr][nc]) {
                maze[r + dr][c + dc] = ' ';
                carveMaze(nr, nc, genVisited);
            }
        }
    }

    private int[] findStart() {
        for (int r = 0; r < ROWS; r++)
            for (int c = 0; c < COLS; c++)
                if (maze[r][c] == 'S') return new int[]{r, c};
        return null;
    }

    private boolean dfs(int r, int c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || visited[r][c] || maze[r][c] == '#')
            return false;

        visited[r][c] = true;

        if (maze[r][c] == 'E') return true;

        if (maze[r][c] != 'S') maze[r][c] = '.';
        mazePanel.repaint();
        sleep(100);

        if (dfs(r - 1, c) || dfs(r + 1, c) || dfs(r, c - 1) || dfs(r, c + 1)) return true;

        if (maze[r][c] != 'S') maze[r][c] = ' ';
        mazePanel.repaint();
        sleep(100);
        return false;
    }

    private void sleep(int ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {}
    }

    private class MazePanel extends JPanel {
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            for (int r = 0; r < ROWS; r++) {
                for (int c = 0; c < COLS; c++) {
                    switch (maze[r][c]) {
                        case '#': g.setColor(Color.BLACK); break;
                        case 'S': g.setColor(Color.GREEN); break;
                        case 'E': g.setColor(Color.RED); break;
                        case '.': g.setColor(Color.CYAN); break;
                        default:  g.setColor(Color.WHITE); break;
                    }
                    g.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    g.setColor(Color.GRAY);
                    g.drawRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }

        public Dimension getPreferredSize() {
            return new Dimension(COLS * CELL_SIZE, ROWS * CELL_SIZE);
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new MazeSolverGUI().setVisible(true));
    }
}
