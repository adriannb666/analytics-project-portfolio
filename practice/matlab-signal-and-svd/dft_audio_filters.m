%% Play the musical note "A" at 440 Herz 
N = 8000;
tt = linspace(0, (N-1)/N, N)';
y = sin(2*pi*440*tt);

sound(y, N)

%% Compute the DFT
Y = fft(y, N);

figure;
plot(real(Y), LineWidth=3); hold on;
plot(imag(Y), LineWidth=3);
plot(abs(Y), LineWidth=1.5)

legend('Real Part', 'Imaginary Part', 'Modulus')

%% Load in a sound file
[y,N]=audioread('brass.mp3'); % You may need to change this file path!

sound(y, N); % Play the sound
%% Part (e): DFT of brass.mp3
[y, Fs] = audioread('brass.mp3');

if size(y,2) == 2
    y = mean(y,2);
end

N = length(y);
Y = fft(y, N);

% Frequency 
f = (0:N-1)*(Fs/N);

% Plot 
figure;
plot(f, abs(Y), 'LineWidth', 1);
xlabel('Frequency (Hz)');
ylabel('|Y(f)|');
title('DFT Magnitude of brass.mp3');

% Better view: first half only
figure;
plot(f(1:floor(N/2)), abs(Y(1:floor(N/2))), 'LineWidth', 1);
xlabel('Frequency (Hz)');
ylabel('|Y(f)|');
title('Frequency Components of brass.mp3');
xlim([0 2000]);


%% Create a low pass filter that allows frequencies up to 500 Hz


Y = fft(y, N);

% Create a low-pass filter
LP = zeros(N,1);
cutoff = 500;                    % cutoff frequency in Hz
k = floor(cutoff * N / Fs);      % corresponding index

% Keep frequencies from 0 to 500 Hz
LP(1:k+1) = 1;

% Keep the symmetric part at the end
LP(N-k+1:N) = 1;

% Apply the filter in the frequency domain
Y_low = Y .* LP;

% Convert back to time domain
y_low = real(ifft(Y_low));

% Play the filtered sound
sound(y_low, Fs);

% Save the filtered sound
audiowrite('brass_lowpass.wav', y_low, Fs);

% Plot the filtered spectrum
f = (0:N-1)*(Fs/N);
figure;
plot(f(1:floor(N/2)), abs(Y_low(1:floor(N/2))), 'LineWidth', 1);
xlabel('Frequency (Hz)');
ylabel('|Y_{low}(f)|');
title('Low-pass Filtered Spectrum (up to 500 Hz)');
xlim([0 2000]);

%% Create a high pass filter that allows frequencies above 1000 Hz

Y = fft(y, N);

HP = ones(N,1);
cutoff = 1000;
k = floor(cutoff * N / Fs);

% Remove frequencies from 0 to 1000 Hz
HP(1:k+1) = 0;

% Remove the symmetric low-frequency part at the end
HP(N-k+1:N) = 0;

% Apply the filter
Y_high = Y .* HP;

% Convert back to time domain
y_high = real(ifft(Y_high));

% Play and save the filtered sound
sound(y_high, Fs);
audiowrite('brass_highpass.wav', y_high, Fs);

% Plot
f = (0:N-1)*(Fs/N);
figure;
plot(f(1:floor(N/2)), abs(Y_high(1:floor(N/2))), 'LineWidth', 1);
xlabel('Frequency (Hz)');
ylabel('|Y_{high}(f)|');
title('High-pass Filtered Spectrum (above 1000 Hz)');
xlim([0 2000]);