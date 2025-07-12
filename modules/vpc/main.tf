# VPC Module for Bedrock Agent Infrastructure

# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-vpc"
    Purpose     = "networking"
    Component   = "chatbot-infrastructure"
    NetworkType = "vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-igw"
    Purpose     = "internet-access"
    Component   = "chatbot-networking"
    NetworkType = "internet-gateway"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.public_subnet_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-public-subnet-${count.index + 1}"
    Purpose     = "public-networking"
    Component   = "chatbot-networking"
    NetworkType = "public-subnet"
    AZ          = data.aws_availability_zones.available.names[count.index]
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.private_subnet_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.public_subnet_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-private-subnet-${count.index + 1}"
    Purpose     = "private-networking"
    Component   = "chatbot-networking"
    NetworkType = "private-subnet"
    AZ          = data.aws_availability_zones.available.names[count.index]
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? var.private_subnet_count : 0

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-nat-eip-${count.index + 1}"
    Purpose     = "nat-gateway"
    Component   = "chatbot-networking"
    NetworkType = "elastic-ip"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? var.private_subnet_count : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-nat-gateway-${count.index + 1}"
    Purpose     = "private-internet-access"
    Component   = "chatbot-networking"
    NetworkType = "nat-gateway"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-public-rt"
    Purpose     = "public-routing"
    Component   = "chatbot-networking"
    NetworkType = "route-table"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = var.public_subnet_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = var.enable_nat_gateway ? var.private_subnet_count : 1

  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.enable_nat_gateway ? aws_nat_gateway.main[count.index].id : null
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-${var.env_name}-private-rt-${count.index + 1}"
    Purpose     = "private-routing"
    Component   = "chatbot-networking"
    NetworkType = "route-table"
  })
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = var.private_subnet_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.enable_nat_gateway ? aws_route_table.private[count.index].id : aws_route_table.private[0].id
}
