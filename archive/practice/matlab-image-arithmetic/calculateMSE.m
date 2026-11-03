function mse = calculateMSE(image1, image2)
    % Ensure the images are of the same size
    if size(image1) ~= size(image2)
        error('Images must be of the same size.');
    end
    
    % Calculate the Mean Squared Error
    difference = double(image1) - double(image2);
    squaredDifference = difference .^ 2;
    mse = sum(squaredDifference(:)) / numel(image1);
end
