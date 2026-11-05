%% Math 325 Mini Project 5 - SVD Image Compression
clear; clc; close all;

%% 1. Read image
% Put einstein.jpg in the same folder as this script
filename = "einstein.jpg";
A = imread(filename);

% If the image is RGB, convert it to grayscale
if ndims(A) == 3
    A = rgb2gray(A);
end

% Convert image matrix to double for SVD calculation
A = double(A);

%% 2. Basic information for part (a)
[m, n] = size(A);
original_storage = m * n;

fprintf("Part (a)\n");
fprintf("Image size: %d x %d\n", m, n);
fprintf("Original storage cost: %d numbers\n\n", original_storage);

%% 3. Full SVD and economy SVD storage for part (b)
% Full SVD
[V_full, S_full, W_full] = svd(A);

% Economy SVD
[V, S, W] = svd(A, "econ");

r = rank(A);

% Full SVD storage:
% V_full is m x m
% S_full is m x n
% W_full is n x n
full_svd_storage = m^2 + m*n + n^2;

% Economy SVD storage:
% If p = min(m,n), then V is m x p, S is p x p, W is n x p
p = min(m, n);
econ_svd_storage = m*p + p^2 + n*p;

fprintf("Part (b)\n");
fprintf("Rank of image matrix: %d\n", r);
fprintf("Full SVD storage cost: %d numbers\n", full_svd_storage);
fprintf("Economy SVD storage cost: %d numbers\n\n", econ_svd_storage);

%% 4. Compressed images for k = 50, 100, 150
k_values = [50, 100, 150];

fprintf("Part (c) and (d)\n");

for i = 1:length(k_values)
    k = k_values(i);

    % Reduced matrices
    Vk = V(:, 1:k);
    Sk = S(1:k, 1:k);
    Wk = W(:, 1:k);

    % Reconstruct compressed image
    Ak = Vk * Sk * Wk';

    % Make sure pixel values stay between 0 and 255
    Ak_uint8 = uint8(max(min(Ak, 255), 0));

    % Storage cost for rank-k approximation:
    % Vk has m*k entries
    % singular values have k entries
    % Wk has n*k entries
    compressed_storage = k * (m + n + 1);

    % Percentage reduction
    reduction_percent = (1 - compressed_storage / original_storage) * 100;

    fprintf("k = %d\n", k);
    fprintf("Reduced V size: %d x %d\n", size(Vk,1), size(Vk,2));
    fprintf("Reduced W size: %d x %d\n", size(Wk,1), size(Wk,2));
    fprintf("Compressed storage cost: %d numbers\n", compressed_storage);
    fprintf("Storage reduction: %.2f%%\n\n", reduction_percent);

    % Save compressed image
    output_name = sprintf("einstein_k%d.jpg", k);
    imwrite(Ak_uint8, output_name);

    % Display compressed image
    figure;
    imshow(Ak_uint8);
    title(sprintf("Compressed Image with k = %d", k));
end

%% 5. Compare JPG file sizes for part (e)
original_info = dir(filename);
original_file_size = original_info.bytes;

fprintf("Part (e)\n");
fprintf("Original JPG file size: %d bytes\n", original_file_size);

for i = 1:length(k_values)
    k = k_values(i);
    output_name = sprintf("einstein_k%d.jpg", k);
    compressed_info = dir(output_name);
    compressed_file_size = compressed_info.bytes;

    file_reduction_percent = ...
        (1 - compressed_file_size / original_file_size) * 100;

    fprintf("k = %d compressed JPG file size: %d bytes\n", ...
        k, compressed_file_size);
    fprintf("JPG file size reduction: %.2f%%\n\n", ...
        file_reduction_percent);
end

%% 6. Show original image
figure;
imshow(uint8(A));
title("Original Image");