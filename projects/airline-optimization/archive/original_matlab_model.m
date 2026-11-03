% Objective function coefficients (same as before)
f = [-10400, -6700, 2400, 400, -4000, -3200, -400, -1600, 0, 0];

% Coefficients for inequality constraints
A = [
    4.2, 3.2, 1.6, 2.2, 0, 0, 0, 0, -10, 0;  % Med-848 flight time constraint
    0, 0, 0, 0, 5.2, 3.7, 1.8, 2.6, 0, -10;  % Smal-286 flight time constraint
    0, 0, 0, 0, 0, 0, 0, 0, 21, 7;           % Budget constraint
    1, 0, 0, 0, 1, 0, 0, 0, 0, 0;            % Max trips to Metropolis
    0, 1, 0, 0, 0, 1, 0, 0, 0, 0;            % Max trips to Cityburg
    0, 0, 1, 0, 0, 0, 1, 0, 0, 0;            % Max trips to Smalltown
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0;            % Max trips to Townville
];

b = [0; 0; 160; 8; 13; 13; 12];  % Right-hand side of inequality constraints

% Coefficients for equality constraints
Aeq = [
    0, 0, 1, 0, 0, 0, 1, 0, 0, 0;  % Smalltown min trips
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0;  % Townville min trips
];

beq = [3; 4];  % Right-hand side of equality constraints

% Lower bounds (non-negativity constraint)
lb = zeros(10,1);  % all variables >= 0

% Upper bounds (optional, but you could add them if needed)
ub = [];

% Indices of integer variables (all 10 variables should be integers in this case)
intcon = 1:10;  % This tells MATLAB that all variables must be integers

% Solve using intlinprog
[x_opt, fval] = intlinprog(f, intcon, A, b, Aeq, beq, lb, ub);

% Display the results
Med848_flights = x_opt(1:4)   % Flights for Med-848
Smal286_flights = x_opt(5:8)  % Flights for Smal-286
Med848_planes = x_opt(9)      % Number of Med-848 planes purchased
Smal286_planes = x_opt(10)    % Number of Smal-286 planes purchased
Profit = -fval                % Maximum profit (negated since we minimized)
