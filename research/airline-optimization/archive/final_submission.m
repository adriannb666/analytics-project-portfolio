% Universal Airways fleet expansion - final submitted version (MATH 347 Project 1, 2024-09-29).
% Transcribed from the report appendix. Minimum-trip requirements are >= constraints (written as -x <= -k).
% Reproduced in Python: ../reproduction/airline_lp.py

% Objective function coefficients
f = [-10400, -6700, 2400, 400, -4000, -3200, -400, -1600, 0, 0];

% Coefficients for inequality constraints
A = [
4.2, 3.2, 1.6, 2.2, 0, 0, 0, 0, -10, 0; % Med-848 flight time constraint
0, 0, 0, 0, 5.2, 3.7, 1.8, 2.6, 0, -10; % Smal-286 flight time constraint
0, 0, 0, 0, 0, 0, 0, 0, 21, 7; % Budget constraint
1, 0, 0, 0, 1, 0, 0, 0, 0, 0; % Max trips to Metropolis
0, 1, 0, 0, 0, 1, 0, 0, 0, 0; % Max trips to Cityburg
0, 0, 1, 0, 0, 0, 1, 0, 0, 0; % Max trips to Smalltown
0, 0, 0, 1, 0, 0, 0, 1, 0, 0; % Max trips to Townville
0, 0, -1, 0, 0, 0, -1, 0, 0, 0; % Smalltown min trips
0, 0, 0, -1, 0, 0, 0, -1, 0, 0; % Townville min trips
];

b = [0; 0; 160; 8; 13; 13; 12; -3; -4]; % Right-hand side of inequality constraints

% Lower bounds (non-negativity constraint)
lb = zeros(10,1); % all variables >= 0

% Upper bounds (could add them if needed)
ub = [];

%solve using linprog
[x_opt, fval] = linprog(f, A, b, [], [], lb, ub);

% Display the results

% Flights for Med-848
Med848_flights_to_Metropolis = x_opt(1)
Med848_flights_to_Cityburg = x_opt(2)
Med848_flights_to_Smalltown = x_opt(3)
Med848_flights_to_Townville = x_opt(4)

% Flights for Smal-286
Smal286_flights_to_Metropolis = x_opt(5)
Smal286_flights_to_Cityburg = x_opt(6)
Smal286_flights_to_Smalltown = x_opt(7)
Smal286_flights_to_Townville = x_opt(8)

Med848_planes = x_opt(9) % Number of Med-848 planes purchased
Smal286_planes = x_opt(10) % Number of Smal-286 planes purchased
Profit = -fval % Maximum profit

% solve using intlinprog

% Indices of integer variables (all 10 variables should be integers in this case)
intcon = 1:10; % This tells MATLAB that all variables must be integers

% solution using intlinprog

[x_opt, fval] = intlinprog(f, intcon, A, b, [], [], lb, ub);

% Display the results

% Flights for Med-848
Med848_flights_to_Metropolis = x_opt(1)
Med848_flights_to_Cityburg = x_opt(2)
Med848_flights_to_Smalltown = x_opt(3)
Med848_flights_to_Townville = x_opt(4)

% Flights for Smal-286
Smal286_flights_to_Metropolis = x_opt(5)
Smal286_flights_to_Cityburg = x_opt(6)
Smal286_flights_to_Smalltown = x_opt(7)
Smal286_flights_to_Townville = x_opt(8)

Med848_planes = x_opt(9) % Number of Med-848 planes purchased
Smal286_planes = x_opt(10) % Number of Smal-286 planes purchased
Profit = -fval % Maximum profit (negated since we minimized)
