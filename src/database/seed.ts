/**
 * Seed script to populate the database with sample data for testing.
 * Run with: pnpm seed
 */

import { initDatabase, closeDatabase } from './connection';
import { createTables } from './schema';
import {
  createFolder,
  createMaterial,
  createTest,
  createQuestion,
  createTestMaterial,
  createCorrelation,
  updateMaterialSM2,
} from './queries';

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateOffset(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return getDateString(date);
}

async function seed(): Promise<void> {
  console.log('Initializing database...');

  await initDatabase();
  createTables();

  console.log('Creating folders...');

  const mathFolder = createFolder('Mathematics', 'material');
  const historyFolder = createFolder('History', 'material');
  const scienceFolder = createFolder('Science', 'material');
  const programmingFolder = createFolder('Programming', 'material');
  const languagesFolder = createFolder('Languages', 'material');

  const mathReview = createFolder('Math Review', 'question');
  const historyReview = createFolder('History Review', 'question');
  const scienceReview = createFolder('Science Review', 'question');

  console.log('Creating materials...');

  const calculusMaterial = createMaterial(
    'Introduction to Calculus',
    '/sample/calculus_intro.pdf',
    'pdf',
    mathFolder.id,
    `Calculus is the mathematical study of continuous change. It has two major branches:
    differential calculus and integral calculus. Differential calculus concerns rates of change
    and slopes of curves, while integral calculus concerns accumulation of quantities and areas
    under curves. The fundamental theorem of calculus relates differentiation and integration,
    showing that these two operations are essentially inverses of each other.

    Key concepts:
    1. Limits: The foundation of calculus, defining how functions behave as they approach a point.
    2. Derivatives: Measure the rate of change of a function. Notation: f'(x) or dy/dx.
    3. Integrals: Represent the area under a curve. Notation: ∫f(x)dx.
    4. The Fundamental Theorem of Calculus: ∫_a^b f(x)dx = F(b) - F(a) where F'(x) = f(x).
    5. Applications: Optimization, related rates, area and volume calculations.

    Important rules:
    - Power Rule: d/dx(x^n) = nx^(n-1)
    - Product Rule: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)
    - Chain Rule: d/dx[f(g(x))] = f'(g(x)) * g'(x)`
  );

  const linearAlgebraMaterial = createMaterial(
    'Linear Algebra Fundamentals',
    '/sample/linear_algebra.md',
    'md',
    mathFolder.id,
    `Linear algebra is the branch of mathematics concerning linear equations and linear functions.
    It is central to almost all areas of mathematics and is fundamental in modern presentations
    of geometry and functional analysis.

    Key concepts:
    1. Vectors: Elements of a vector space, representing quantities with magnitude and direction.
    2. Matrices: Rectangular arrays of numbers arranged in rows and columns.
    3. Linear Transformations: Functions between vector spaces that preserve vector addition
       and scalar multiplication.
    4. Eigenvalues and Eigenvectors: For a matrix A, an eigenvector v satisfies Av = λv,
       where λ is the eigenvalue.
    5. Determinants: A scalar value that can be computed from the elements of a square matrix,
       representing the scaling factor of the linear transformation.

    Connection to Calculus:
    - Matrix calculus extends calculus to matrix-valued functions
    - The Jacobian matrix contains all first-order partial derivatives
    - The Hessian matrix contains second-order partial derivatives
    - Linear algebra provides the framework for solving systems of differential equations`
  );

  const wwiiMaterial = createMaterial(
    'World War II Overview',
    '/sample/wwii_overview.docx',
    'docx',
    historyFolder.id,
    `World War II (1939-1945) was the deadliest conflict in human history, involving more than
    30 countries and resulting in 70-85 million fatalities. The war was fought between the Axis
    powers (primarily Germany, Italy, and Japan) and the Allied powers.

    Major Events Timeline:
    - 1939: Germany invades Poland, beginning the war in Europe
    - 1940: Battle of Britain, Germany's first major defeat
    - 1941: Operation Barbarossa (invasion of USSR); Pearl Harbor attack (US enters war)
    - 1942: Battle of Stalingrad (turning point in Eastern Front); Battle of Midway
    - 1943: Allied invasion of Italy; Tehran Conference
    - 1944: D-Day (Normandy invasion); Battle of the Bulge
    - 1945: Fall of Berlin; Atomic bombings of Hiroshima and Nagasaki; Japanese surrender

    Key Causes:
    - Treaty of Versailles and its harsh terms on Germany
    - Rise of fascism and militarism
    - Great Depression economic conditions
    - Failure of the League of Nations
    - Appeasement policy toward aggressor nations

    Consequences:
    - Creation of the United Nations
    - Beginning of the Cold War
    - Decolonization movements in Asia and Africa
    - Establishment of Israel
    - Marshall Plan for European reconstruction`
  );

  const physicsMaterial = createMaterial(
    'Classical Mechanics',
    '/sample/mechanics.pptx',
    'pptx',
    scienceFolder.id,
    `Classical mechanics is a physical theory describing the motion of macroscopic objects.
    It provides extremely accurate results when studying objects that are much larger than
    atoms and moving much slower than the speed of light.

    Newton's Three Laws of Motion:
    1. First Law (Inertia): An object at rest stays at rest, and an object in motion stays
       in motion with the same speed and direction, unless acted upon by an unbalanced force.
    2. Second Law (F = ma): The acceleration of an object is directly proportional to the
       net force acting on it and inversely proportional to its mass.
    3. Third Law: For every action, there is an equal and opposite reaction.

    Conservation Laws:
    - Conservation of Energy: Energy cannot be created or destroyed
    - Conservation of Momentum: m1v1 + m2v2 = constant (in closed system)
    - Conservation of Angular Momentum: L = r × p = Iω

    Kinematics Equations:
    - v = v0 + at
    - x = x0 + v0t + (1/2)at²
    - v² = v0² + 2a(x - x0)

    Connection to Calculus:
    - Velocity is the derivative of position: v = dx/dt
    - Acceleration is the derivative of velocity: a = dv/dt = d²x/dt²
    - Work is the integral of force over distance: W = ∫F·dx
    - Impulse is the integral of force over time: J = ∫F·dt`
  );

  createMaterial(
    'Python Data Structures',
    '/sample/python_data.md',
    'md',
    programmingFolder.id,
    `Python provides several built-in data structures that make it easy to organize and
    manipulate data efficiently.

    Lists:
    - Ordered, mutable collections: fruits = ['apple', 'banana', 'cherry']
    - Support indexing, slicing, and methods like append(), extend(), pop()
    - List comprehensions: [x**2 for x in range(10)]
    - Time complexity: O(1) for indexing, O(n) for searching

    Tuples:
    - Ordered, immutable collections: point = (3, 4)
    - Useful for returning multiple values from functions
    - More memory efficient than lists
    - Can be used as dictionary keys (unlike lists)

    Dictionaries:
    - Key-value pairs: student = {'name': 'Alice', 'age': 20}
    - O(1) average time for lookup, insertion, deletion
    - Keys must be hashable (immutable types)
    - dict.get(key, default) for safe access

    Sets:
    - Unordered collections of unique elements
    - Set operations: union, intersection, difference
    - Useful for removing duplicates from lists
    - Fast membership testing: O(1) average

    Advanced Concepts:
    - Generators for memory-efficient iteration
    - Collections module: defaultdict, Counter, deque, namedtuple
    - Time/space complexity analysis (Big O notation)`
  );

  updateMaterialSM2(calculusMaterial.id, 6, 2.5, 2, getDateOffset(0));
  updateMaterialSM2(linearAlgebraMaterial.id, 1, 2.3, 1, getDateOffset(0));
  updateMaterialSM2(wwiiMaterial.id, 0, 2.5, 0, getDateOffset(0));
  updateMaterialSM2(physicsMaterial.id, 4, 2.6, 3, getDateOffset(1));

  console.log('Creating correlations...');

  createCorrelation(calculusMaterial.id, linearAlgebraMaterial.id, 8);
  createCorrelation(calculusMaterial.id, physicsMaterial.id, 7);

  console.log('Creating sample test...');

  const today = getDateString(new Date());
  const sampleTest = createTest(`${today.replace(/-/g, '/')} - Math & History Daily Review`, today);

  createQuestion(
    sampleTest.id,
    'easy',
    'What is the derivative of x^n according to the Power Rule?',
    ['A. nx^(n+1)', 'B. nx^(n-1)', 'C. (n-1)x^n', 'D. x^(n)'],
    'B',
    'The Power Rule states d/dx(x^n) = nx^(n-1). This is one of the most fundamental rules in differential calculus.'
  );

  createQuestion(
    sampleTest.id,
    'easy',
    'In which year did World War II begin?',
    ['A. 1937', 'B. 1938', 'C. 1939', 'D. 1941'],
    'C',
    'World War II began in 1939 when Germany invaded Poland. Britain and France declared war on Germany shortly after.'
  );

  createQuestion(
    sampleTest.id,
    'medium',
    'What does the Fundamental Theorem of Calculus establish?',
    ['A. That all functions are differentiable', 'B. That differentiation and integration are inverse operations', 'C. That integrals always converge', 'D. That derivatives are always continuous'],
    'B',
    'The Fundamental Theorem of Calculus shows that differentiation and integration are inverse operations.'
  );

  createQuestion(
    sampleTest.id,
    'medium',
    'Which of the following was NOT a major cause of World War II?',
    ['A. Treaty of Versailles', 'B. Rise of fascism', 'C. The Industrial Revolution', 'D. Failure of the League of Nations'],
    'C',
    'The Industrial Revolution occurred much earlier (late 18th-early 19th centuries) and was not a direct cause of WWII.'
  );

  createQuestion(
    sampleTest.id,
    'medium',
    'What is the relationship between eigenvalues and eigenvectors in linear algebra?',
    ['A. Eigenvalues are always larger than eigenvectors', 'B. They are unrelated concepts', 'C. For a matrix A, an eigenvector v satisfies Av = λv where λ is the eigenvalue', 'D. Eigenvectors measure the size of eigenvalues'],
    'C',
    'An eigenvector v of a matrix A satisfies the equation Av = λv, where λ is the corresponding eigenvalue.'
  );

  createQuestion(
    sampleTest.id,
    'hard',
    'How does calculus relate to linear algebra in the context of multi-variable functions? Consider both the Jacobian and Hessian matrices.',
    ['A. Calculus is completely independent of linear algebra', 'B. Linear algebra replaces calculus for multi-variable functions', 'C. The Jacobian and Hessian matrices use linear algebra to organize partial derivatives, connecting both fields', 'D. Linear algebra only provides notation without adding value'],
    'C',
    'Calculus and linear algebra intersect in multi-variable calculus. The Jacobian matrix organizes all first-order partial derivatives as a matrix, while the Hessian matrix organizes second-order partial derivatives. These matrices use linear algebra techniques to analyze multi-variable functions.'
  );

  createQuestion(
    sampleTest.id,
    'hard',
    'Analyze the relationship between Newton\'s Second Law (F = ma) in physics and the mathematical concepts of derivatives in calculus. How does this connection enable the prediction of motion?',
    ['A. There is no mathematical connection between F=ma and calculus', 'B. F=ma only uses basic algebra, not calculus', 'C. Since acceleration a = dv/dt = d²x/dt², Newton\'s Second Law becomes a differential equation F = m(d²x/dt²) that can be solved to predict position over time', 'D. Calculus is only useful for constant forces'],
    'C',
    'Newton\'s Second Law F = ma directly connects to calculus because acceleration is the second derivative of position. Writing F = m(d²x/dt²) transforms it into a differential equation. For any given force function F(t) or F(x), this equation can be solved using integration techniques to predict the exact position x(t) of an object at any time.'
  );

  createTestMaterial(sampleTest.id, calculusMaterial.id);
  createTestMaterial(sampleTest.id, linearAlgebraMaterial.id);
  createTestMaterial(sampleTest.id, wwiiMaterial.id);

  console.log('\nSeed data created successfully!');
  console.log('============================');
  console.log('Folders created: 8');
  console.log('Materials created: 5');
  console.log('Tests created: 1');
  console.log('Questions created: 7');
  console.log('Correlations created: 3');
  console.log(`\nMaterials due today: ${getDateString(new Date())}`);
  console.log('- Introduction to Calculus (interval: 6, EF: 2.5)');
  console.log('- Linear Algebra Fundamentals (interval: 1, EF: 2.3)');
  console.log('- World War II Overview (interval: 0, EF: 2.5)');
  console.log(`\nMaterials due tomorrow: ${getDateOffset(1)}`);
  console.log('- Classical Mechanics');

  await closeDatabase();
}

seed().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});